import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// The migration tools are plain Node ESM so they can run without a build.
// @ts-ignore JavaScript migration module
import { readSource, assertSnapshotsMatch, commitPreflight } from '../scripts/migration-common.mjs';
// @ts-ignore JavaScript migration module
import { migrateObjects } from '../scripts/migrate-postgres-binary-to-storage.mjs';

test('SQLite read-only validation detects foreign ownership, cycles and changed snapshots', () => {
  const dir = mkdtempSync(join(tmpdir(), 'storage-migration-unit-'));
  const file = join(dir, 'fixture.db');
  const db = new DatabaseSync(file);
  try {
    db.exec(`CREATE TABLE User (id TEXT, createdAt INTEGER, updatedAt INTEGER);
      CREATE TABLE Node (id TEXT, ownerId TEXT, parentId TEXT, type TEXT, content TEXT, data BLOB, size INTEGER, createdAt INTEGER, updatedAt INTEGER);
      INSERT INTO User VALUES ('u', 1000, 1000);
      INSERT INTO Node VALUES ('root','u',NULL,'FOLDER',NULL,NULL,NULL,1000,1000);
      INSERT INTO Node VALUES ('file','u','root','FILE','hello',NULL,5,1000,1000);`);
    const snapshot = readSource(file);
    assertSnapshotsMatch(snapshot, readSource(file));
    db.exec("UPDATE Node SET content = 'changed' WHERE id = 'file'");
    assert.throws(() => assertSnapshotsMatch(snapshot, readSource(file)));
    db.exec("UPDATE Node SET ownerId = 'other' WHERE id = 'file'");
    assert.throws(() => readSource(file));
    db.exec("UPDATE Node SET ownerId = 'u' WHERE id = 'file'; UPDATE Node SET parentId = 'root' WHERE id = 'root'");
    assert.throws(() => readSource(file));
    assert.throws(() => commitPreflight(file));
  } finally { db.close(); rmSync(dir, { recursive: true }); }
});

test('Storage migration is non-destructive, verifies bytes, handles partial DB writes and retries', async () => {
  const row = { id: 'node', ownerId: 'owner', size: 3, data: Buffer.from('abc'), mimeType: 'application/octet-stream', storageKey: null as string | null };
  const objects = new Map<string, Buffer>();
  let failDb = true, uploads = 0, privateBucket = true;
  const client = { query: async (sql: string, args: any[]) => {
    if (sql.startsWith('SELECT')) return { rows: [row] };
    if (failDb) throw new Error('injected DB failure');
    row.storageKey = args[0]; return { rowCount: 1 };
  } };
  const store = {
    download: async (key: string) => objects.has(key) ? { data: new Blob([new Uint8Array(objects.get(key)!)]), error: null } : { error: { statusCode: '404' } },
    upload: async (key: string, data: Buffer, options: any) => {
      assert.equal(options.upsert, false); uploads++; assert.equal(objects.has(key), false); objects.set(key, data);
      return { error: { statusCode: 'timeout' } }; // successful upload, lost response
    },
    list: async () => ({ data: [...objects.keys()].map((k) => ({ name: k.split('/').pop() })), error: null }),
  };
  const supabase = { storage: { getBucket: async () => ({ data: { public: !privateBucket }, error: null }), from: () => store } };
  await migrateObjects(client, supabase, 'user-files', false);
  assert.equal(uploads, 0); assert.equal(row.storageKey, null);
  await assert.rejects(migrateObjects(client, supabase, 'user-files', true));
  assert.equal(uploads, 1); assert.equal(row.storageKey, null);
  failDb = false;
  await migrateObjects(client, supabase, 'user-files', true);
  await migrateObjects(client, supabase, 'user-files', true);
  assert.equal(uploads, 1); assert.equal(row.storageKey, 'owner/node/legacy-v1');
  assert.equal(row.data.toString(), 'abc');
  objects.set(row.storageKey!, Buffer.from('bad'));
  await assert.rejects(migrateObjects(client, supabase, 'user-files', true));
  privateBucket = false;
  await assert.rejects(migrateObjects(client, supabase, 'user-files', true));
});
