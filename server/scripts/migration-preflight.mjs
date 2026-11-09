import { commitPreflight, pgClient, readSource } from './migration-common.mjs';
import { X509Certificate } from 'node:crypto';
import { readFileSync } from 'node:fs';

let client;
try {
  for (const key of ['MIGRATION_SOURCE_DB', 'MIGRATION_TARGET_DB', 'NODE_EXTRA_CA_CERTS']) {
    if (!process.env[key]) throw new Error(`Missing ${key}`);
  }
  commitPreflight(process.env.MIGRATION_SOURCE_DB);
  const source = readSource(process.env.MIGRATION_SOURCE_DB);
  const binary = source.nodes.filter((n) => n.data !== null);
  const cert = new X509Certificate(readFileSync(process.env.NODE_EXTRA_CA_CERTS));
  console.log(JSON.stringify({ integrity: 'ok', backupMatchesOriginal: true, users: source.users.length,
    nodes: source.nodes.length, binaryFiles: binary.length, binaryBytes: binary.reduce((s, n) => s + n.data.length, 0),
    caValidUntil: cert.validTo }));
  client = pgClient(process.env.MIGRATION_TARGET_DB);
  await client.connect();
  const { rows } = await client.query('SELECT (SELECT COUNT(*)::int FROM "User") AS users, (SELECT COUNT(*)::int FROM "Node") AS nodes');
  console.log(JSON.stringify({ destination: rows[0], tls: 'certificate validation enabled' }));
  if (rows[0].users !== 0 || rows[0].nodes !== 0) throw new Error('Destination not empty');
  console.log('Migration preflight passed');
} catch {
  console.error('Migration preflight failed; no data modified. Check configuration, confirmations, CA, backup and destination.');
  process.exitCode = 1;
} finally { await client?.end(); }
