import { DatabaseSync } from 'node:sqlite';
import { createHash, X509Certificate } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import pg from 'pg';

export const hash = (bytes) => createHash('sha256').update(Buffer.from(bytes)).digest('hex');
export function dateString(value) {
  const d = typeof value === 'number' || /^\d+$/.test(value)
    ? new Date(Number(value)) : new Date(/(?:Z|[+-]\d\d:\d\d)$/i.test(value) ? value : value.trim().replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) throw new Error('Invalid source timestamp');
  return d.toISOString();
}

export function readSource(path) {
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    if (db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') throw new Error('SQLite integrity failed');
    if (db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('SQLite foreign key check failed');
    const users = db.prepare('SELECT * FROM "User" ORDER BY id').all();
    const nodes = db.prepare('SELECT * FROM "Node" ORDER BY id').all();
    const owners = new Set(users.map((u) => u.id));
    const byId = new Map(nodes.map((n) => [n.id, n]));
    for (const node of nodes) {
      if (!owners.has(node.ownerId)) throw new Error('Unknown owner');
      if (!['FILE', 'FOLDER'].includes(node.type)) throw new Error('Invalid node type');
      if (node.type === 'FILE' && ((node.data === null) === (node.content === null))) throw new Error('Ambiguous file body');
      if (node.type === 'FOLDER' && (node.data !== null || node.content !== null)) throw new Error('Folder has file body');
      if (node.data !== null && node.size !== node.data.length) throw new Error('Binary size mismatch');
      if (node.parentId === null && node.type !== 'FOLDER') throw new Error('Invalid root');
      const visited = new Set([node.id]);
      let current = node;
      while (current.parentId !== null) {
        const parent = byId.get(current.parentId);
        if (!parent || parent.ownerId !== node.ownerId || parent.type !== 'FOLDER') throw new Error('Invalid parent');
        if (visited.has(parent.id)) throw new Error('Hierarchy cycle');
        visited.add(parent.id); current = parent;
      }
    }
    for (const user of users) if (nodes.filter((n) => n.ownerId === user.id && n.parentId === null).length !== 1) throw new Error('Expected one root per owner');
    for (const record of [...users, ...nodes]) for (const field of ['createdAt', 'updatedAt']) dateString(record[field]);
    return { users, nodes };
  } finally { db.close(); }
}

function canonical(record) {
  return Object.fromEntries(Object.keys(record).sort().map((key) => [key,
    key === 'data' && record[key] !== null ? hash(record[key]) :
    ['createdAt', 'updatedAt'].includes(key) ? dateString(record[key]) : record[key],
  ]));
}

export function assertSnapshotsMatch(a, b) {
  for (const table of ['users', 'nodes']) {
    if (JSON.stringify(a[table].map(canonical)) !== JSON.stringify(b[table].map(canonical))) throw new Error('Source and backup logical data differ');
  }
}

export function commitPreflight(sourcePath) {
  if (process.env.MIGRATION_PASSWORD_ROTATED !== 'yes') throw new Error('Database password rotation confirmation is required');
  if (process.env.MIGRATION_WRITES_STOPPED !== 'yes') throw new Error('SQLite writers must be stopped');
  const original = process.env.MIGRATION_ORIGINAL_DB || 'prisma/dev.db';
  if (realpathSync(original) === realpathSync(sourcePath)) throw new Error('Use an independent SQLite backup');
  const caPath = process.env.NODE_EXTRA_CA_CERTS;
  if (!caPath) throw new Error('NODE_EXTRA_CA_CERTS is required at process startup');
  const cert = new X509Certificate(readFileSync(caPath));
  if (!cert.ca || Date.parse(cert.validFrom) > Date.now() || Date.parse(cert.validTo) <= Date.now()) throw new Error('Database CA certificate is invalid or expired');
  assertSnapshotsMatch(readSource(original), readSource(sourcePath));
}

export function pgClient(connectionString) {
  if (!connectionString) throw new Error('MIGRATION_TARGET_DB is required');
  const url = new URL(connectionString);
  if (!['postgresql:', 'postgres:'].includes(url.protocol)) throw new Error('PostgreSQL URL required');
  // Strip driver-specific URL SSL switches, which otherwise override ssl options.
  for (const name of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'sslaccept', 'ssl', 'pgbouncer', 'connection_limit']) url.searchParams.delete(name);
  const localTest = process.env.NODE_ENV === 'test' && ['127.0.0.1', 'localhost'].includes(url.hostname);
  return new pg.Client({ connectionString: url.toString(),
    ...(localTest ? {} : { ssl: { rejectUnauthorized: true } }),
    connectionTimeoutMillis: 10000, statement_timeout: 60000,
  });
}

export async function verifyDestination(client, source) {
  for (const [table, records] of [['User', source.users], ['Node', source.nodes]]) {
    const { rows } = await client.query(`SELECT *, to_char("createdAt", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt", to_char("updatedAt", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt" FROM "${table}" ORDER BY id`);
    if (rows.length !== records.length) throw new Error('Destination count mismatch');
    for (let i = 0; i < rows.length; i++) {
      // Compare every legacy column, allowing the new storageKey column.
      const projected = Object.fromEntries(Object.keys(records[i]).map((key) => [key, rows[i][key]]));
      if (JSON.stringify(canonical(projected)) !== JSON.stringify(canonical(records[i]))) throw new Error(`Full-field verification failed: ${table}`);
    }
  }
  console.log('All legacy fields, timestamps and binary hashes verified');
}
