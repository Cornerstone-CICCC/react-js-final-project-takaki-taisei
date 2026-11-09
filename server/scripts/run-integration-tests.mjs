import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import pg from 'pg';

const adminUrl = process.env.TEST_DATABASE_ADMIN_URL;
if (!adminUrl) throw new Error('Set TEST_DATABASE_ADMIN_URL to a disposable local PostgreSQL instance');
const url = new URL(adminUrl);
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Integration tests require localhost PostgreSQL');
const name = `storage_test_${randomUUID().replaceAll('-', '')}`;
const admin = new pg.Client({ connectionString: adminUrl });
try {
  await admin.connect();
  await admin.query(`CREATE DATABASE "${name}"`);
  url.pathname = '/' + name;
  const env = { ...process.env, NODE_ENV: 'test', DATABASE_URL: url.toString(),
    JWT_SECRET: 'isolated-tests-only-secret-at-least-32-characters',
    SUPABASE_SECRET_KEY: 'sb_secret_isolated_test', CORS_ORIGIN: 'http://localhost:5173,http://127.0.0.1:5173',
    STORAGE_TIMEOUT_MS: '200', TEST_DATABASE_ISOLATED: 'yes' };
  for (const args of [['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
    ['--import', 'tsx', '--test', 'test/integration.test.ts']]) {
    const result = spawnSync(process.execPath, args, { env, stdio: 'inherit' });
    if (result.status !== 0) { process.exitCode = result.status || 1; break; }
  }
} finally {
  await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
  await admin.end();
}
