import { pgClient, readSource, verifyDestination } from './migration-common.mjs';
const client = pgClient(process.env.MIGRATION_TARGET_DB);
try {
  const source = readSource(process.env.MIGRATION_SOURCE_DB);
  await client.connect();
  await verifyDestination(client, source);
} catch {
  console.error('Migration verification failed; no data modified');
  process.exitCode = 1;
} finally { await client.end(); }
