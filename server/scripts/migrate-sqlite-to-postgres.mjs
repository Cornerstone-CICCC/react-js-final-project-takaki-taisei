import { DatabaseSync } from "node:sqlite";
import { resolve } from "node:path";
import { commitPreflight, pgClient, readSource, verifyDestination } from "./migration-common.mjs";
import { createHash } from "node:crypto";

function parseSqliteDate(value) {
  if (typeof value === "number") {
    return new Date(value);
  }

  if (typeof value === "string") {
    if (/^\d+$/.test(value)) {
      return new Date(Number(value));
    }

    const normalized = value.trim().replace(" ", "T");

    const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(normalized);

    return new Date(hasTimezone ? normalized : `${normalized}Z`);
  }

  return new Date(NaN);
}

function toPgTimestamp(value) {
  const date = parseSqliteDate(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid timestamp");
  }

  return date.toISOString().slice(0, 23).replace("T", " ");
}

function sha256(bytes) {
  return createHash("sha256").update(Buffer.from(bytes)).digest("hex");
}

async function main() {
// 1. 移行元のDBを指定
const sourcePath = process.env.MIGRATION_SOURCE_DB;

if (!sourcePath) {
  throw new Error("MIGRATION_SOURCE_DB is required");
}

const verifiedSource = readSource(sourcePath);
if (process.env.MIGRATION_COMMIT === "yes") commitPreflight(sourcePath);

// 2. SQLiteを読み取り専用で開く
const db = new DatabaseSync(resolve(sourcePath), { readOnly: true });

try {
  // 3. ユーザーとノードを取得
  const users = db.prepare('SELECT * FROM "User"').all();
  const nodes = db.prepare('SELECT * FROM "Node"').all();

  // 4. ファイルを分類
  const files = nodes.filter((node) => node.type === "FILE");
  const folders = nodes.filter((node) => node.type === "FOLDER");

  const binaryFiles = files.filter((file) => file.data !== null);
  const textFiles = files.filter((file) => file.content !== null);

  // 5. バイナリデータの合計サイズ
  const binaryBytes = binaryFiles.reduce(
    (total, file) => total + file.data.byteLength,
    0,
  );

  // 6. 外部キー参照の整合性を検証
  const userIds = new Set(users.map((user) => user.id));
  const nodeIds = new Set(nodes.map((node) => node.id));

  for (const node of nodes) {
    if (!userIds.has(node.ownerId)) {
      throw new Error("Node references a missing user");
    }

    if (node.parentId !== null && !nodeIds.has(node.parentId)) {
      throw new Error("Node references a missing parent");
    }
  }

  // 7. 日時の変換を検証
  for (const record of [...users, ...nodes]) {
    for (const field of ["createdAt", "updatedAt"]) {
      const date = parseSqliteDate(record[field]);

      if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid timestamp in ${field}`);
      }
    }
  }

  // 8. 結果を表示（個人情報は表示しない）
  console.log("Migration source verified");
  console.log("Users:", users.length);
  console.log("Folders:", folders.length);
  console.log("Text files:", textFiles.length);
  console.log("Binary files:", binaryFiles.length);
  console.log("Binary bytes:", binaryBytes);

  // 9. PostgreSQLへの移行準備
  const targetUrl = process.env.MIGRATION_TARGET_DB;

  if (!targetUrl) {
    throw new Error("MIGRATION_TARGET_DB is required");
  }

  const client = pgClient(targetUrl);

  const shouldCommit = process.env.MIGRATION_COMMIT === "yes";

  let transactionStarted = false;

  try {
    await client.connect();

    console.log("Connected to PostgreSQL");

    // 10. Transaction開始
    await client.query("BEGIN");
    transactionStarted = true;
    await client.query('LOCK TABLE "User", "Node" IN EXCLUSIVE MODE');

    // 11. 移行先が空であることを再確認
    const current = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM "User") AS users,
        (SELECT COUNT(*)::int FROM "Node") AS nodes
    `);

    if (current.rows[0].users !== 0 || current.rows[0].nodes !== 0) {
      throw new Error("Target database is not empty");
    }

    // 12. Userをコピー
    for (const user of users) {
      await client.query(
        `
        INSERT INTO "User"
        (
          "id",
          "username",
          "email",
          "passwordHash",
          "createdAt",
          "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          user.id,
          user.username,
          user.email,
          user.passwordHash,
          toPgTimestamp(user.createdAt),
          toPgTimestamp(user.updatedAt),
        ],
      );
    }

    console.log("Users copied:", users.length);

    // 13. Nodeをコピー
    // 親子関係は後から設定する
    for (const node of nodes) {
      await client.query(
        `
        INSERT INTO "Node"
        (
          "id",
          "name",
          "type",
          "content",
          "data",
          "mimeType",
          "size",
          "storageKey",
          "ownerId",
          "parentId",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11, $12
        )
        `,
        [
          node.id,
          node.name,
          node.type,
          node.content,
          node.data === null ? null : Buffer.from(node.data),
          node.mimeType,
          node.size,
          null,
          node.ownerId,
          null,
          toPgTimestamp(node.createdAt),
          toPgTimestamp(node.updatedAt),
        ],
      );
    }

    console.log("Nodes copied:", nodes.length);

    // 14. 親子関係を復元
    for (const node of nodes) {
      if (node.parentId !== null) {
        await client.query(
          `
          UPDATE "Node"
          SET "parentId" = $1
          WHERE "id" = $2
          `,
          [node.parentId, node.id],
        );
      }
    }

    console.log("Parent relationships restored");

    // 15. 保存件数を検証
    const result = await client.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE "data" IS NOT NULL
        )::int AS binary_count,
        COALESCE(
          SUM(OCTET_LENGTH("data")),
          0
        )::bigint AS binary_bytes
      FROM "Node"
    `);

    const saved = result.rows[0];

    if (
      saved.total !== nodes.length ||
      saved.binary_count !== binaryFiles.length ||
      BigInt(saved.binary_bytes) !== BigInt(binaryBytes)
    ) {
      throw new Error("Node verification failed");
    }

    // 16. バイナリの内容をSHA-256で検証
    for (const file of binaryFiles) {
      const result = await client.query(
        `SELECT "data" FROM "Node" WHERE "id" = $1`,
        [file.id],
      );

      const savedData = result.rows[0]?.data;

      if (!savedData || sha256(savedData) !== sha256(file.data)) {
        throw new Error("Binary checksum mismatch");
      }
    }

    console.log("Binary checksums verified");

    // 17. テキストの内容を検証
    for (const file of textFiles) {
      const result = await client.query(
        `SELECT "content" FROM "Node" WHERE "id" = $1`,
        [file.id],
      );

      if (result.rows[0]?.content !== file.content) {
        throw new Error("Text content mismatch");
      }
    }

    console.log("Text contents verified");

    await verifyDestination(client, verifiedSource);

    // 18. Dry Run または正式保存
    if (shouldCommit) {
      await client.query("COMMIT");
      transactionStarted = false;
      console.log("Migration committed successfully");
      await verifyDestination(client, verifiedSource);
    } else {
      await client.query("ROLLBACK");
      transactionStarted = false;
      console.log("Dry run completed. All changes rolled back.");
    }
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }

    throw error;
  } finally {
    await client.end();
  }
} finally {
  db.close();
}

}
main().catch(() => {
  console.error("SQLite migration failed. Inspect prerequisites and destination counts before retrying; credentials are omitted.");
  process.exitCode = 1;
});
