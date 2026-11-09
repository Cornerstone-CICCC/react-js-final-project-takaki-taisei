import 'dotenv/config';
import { spawnSync } from 'node:child_process';

// NODE_EXTRA_CA_CERTS is read at Node startup, not when dotenv mutates env.
// Start a fresh process after loading the secure, ignored .env file.
const commands = {
  sqlite: 'migrate-sqlite-to-postgres.mjs',
  storage: 'migrate-postgres-binary-to-storage.mjs',
  verify: 'verify-migration.mjs',
  preflight: 'migration-preflight.mjs',
};
const script = commands[process.argv[2]];
if (!script) throw new Error('Choose sqlite, storage, verify or preflight');
const result = spawnSync(process.execPath, [`scripts/${script}`], { env: process.env, stdio: 'inherit' });
process.exitCode = result.status ?? 1;
