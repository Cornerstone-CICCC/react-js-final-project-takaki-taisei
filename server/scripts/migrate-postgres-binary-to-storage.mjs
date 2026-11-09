import { createClient } from '@supabase/supabase-js';
import { hash, pgClient } from './migration-common.mjs';

export function migrationKey(ownerId, nodeId) {
  if (![ownerId, nodeId].every((s) => /^[a-zA-Z0-9_-]{1,128}$/.test(s))) throw new Error('Invalid object identity');
  return `${ownerId}/${nodeId}/legacy-v1`;
}

export async function migrateObjects(client, supabase, bucket, commit) {
  const { data: config, error: bucketError } = await supabase.storage.getBucket(bucket);
  if (bucketError || !config || config.public !== false) throw new Error('Private bucket is required');
  const store = supabase.storage.from(bucket);
  const { rows } = await client.query('SELECT * FROM "Node" WHERE "type" = $1 AND "content" IS NULL ORDER BY "id"', ['FILE']);
  let verified = 0;
  for (const node of rows) {
    if (node.data === null || node.size !== node.data.length) throw new Error('Source binary missing or size mismatch');
    const key = migrationKey(node.ownerId, node.id);
    if (node.storageKey !== null && node.storageKey !== key) throw new Error('Conflicting storage reference');
    let result = await store.download(key);
    if (result.error) {
      // Only an explicit missing-object response permits an upload.
      if (![result.error.statusCode, result.error.code].some((value) => ['404', 'NoSuchKey', 'not_found'].includes(String(value)))) throw new Error('Cannot inspect Storage object');
      if (node.storageKey) throw new Error('Referenced migration object is missing');
      if (!commit) continue;
      const uploaded = await store.upload(key, node.data, { contentType: node.mimeType || 'application/octet-stream', upsert: false });
      // Upload may have succeeded before a timeout. Verify by reading, even if
      // the upload reports an error. Never overwrite or delete on a retry.
      result = await store.download(key);
      if (result.error || !result.data) throw new Error(uploaded.error ? 'Upload outcome unresolved; retry safely' : 'Upload verification unavailable');
    }
    const bytes = Buffer.from(await result.data.arrayBuffer());
    if (bytes.length !== node.size || hash(bytes) !== hash(node.data)) throw new Error('Storage checksum conflict; no overwrite performed');
    if (commit) {
      const saved = await client.query('UPDATE "Node" SET "storageKey" = $1 WHERE "id" = $2 AND ("storageKey" IS NULL OR "storageKey" = $1) AND "data" = $3 AND "ownerId" = $4 AND "size" = $5', [key, node.id, node.data, node.ownerId, node.size]);
      if (saved.rowCount !== 1) throw new Error('Node changed during migration');
    }
    verified++;
  }
  if (commit && verified !== rows.length) throw new Error('Incomplete Storage migration');
  // Enumerate each migration node prefix to detect unexpected partial objects.
  if (commit) for (const node of rows) {
    const { data, error } = await store.list(`${node.ownerId}/${node.id}`, { limit: 100 });
    if (error || !data || data.length !== 1 || data[0].name !== 'legacy-v1') throw new Error('Unexpected objects in migration prefix');
  }
  console.log(JSON.stringify({ expected: rows.length, verified, bytes: rows.reduce((n, row) => n + row.size, 0), mode: commit ? 'committed' : 'read-only' }));
  return { expected: rows.length, verified };
}

async function main() {
  const commit = process.env.STORAGE_MIGRATION_COMMIT === 'yes';
  if (commit && process.env.MIGRATION_WRITES_STOPPED !== 'yes') throw new Error('Application writes must be stopped');
  if (!process.env.SUPABASE_SECRET_KEY?.startsWith('sb_secret_')) throw new Error('Server secret key required');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(30000) }) },
  });
  const client = pgClient(process.env.MIGRATION_TARGET_DB);
  try {
    await client.connect();
    await client.query("SELECT pg_advisory_lock(hashtextextended('storage-migration', 0))");
    await migrateObjects(client, supabase, process.env.SUPABASE_STORAGE_BUCKET || 'user-files', commit);
  } finally { await client.end(); }
}

if (process.argv[1]?.endsWith('migrate-postgres-binary-to-storage.mjs')) main().catch(() => {
  console.error('Storage migration failed. No source bytes removed. Inspect references and retry after resolving the failure.');
  process.exitCode = 1;
});
