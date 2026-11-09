import { createApp } from './app';
import { env, validateEnvironment } from './config/env';
import { prisma } from './lib/prisma';
import { storage } from './lib/storage';
import { processStorageCleanup } from './services/storageCleanup.service';

async function main() {
  validateEnvironment();
  await prisma.$connect();
  await storage.assertPrivate();
  if (await prisma.node.count({ where: { type: 'FILE', content: null, storageKey: null } })) {
    throw new Error('Binary storage migration is incomplete');
  }
  await prisma.storageCleanup.count(); // fail before listening if migration 0002 is missing

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`🗂  Pseudo-FS API listening on http://localhost:${env.port}`);
    console.log(`   Health:  http://localhost:${env.port}/api/health`);
    console.log(`   Tree:    http://localhost:${env.port}/api/tree`);
  });
  server.requestTimeout = 60000;
  server.headersTimeout = 15000;

  let cleanup: Promise<void> | undefined;
  const timer = setInterval(() => {
    if (!cleanup) cleanup = processStorageCleanup().catch(() => {
      console.error(JSON.stringify({ event: 'cleanup_worker_failed' }));
    }).finally(() => { cleanup = undefined; });
  }, 30000);
  timer.unref();
  let stopping = false;
  const shutdown = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    console.log(`\n${signal} received — shutting down...`);
    clearInterval(timer);
    const deadline = setTimeout(() => process.exit(1), 60000);
    deadline.unref();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await cleanup;
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch(() => {
  console.error(JSON.stringify({ event: 'startup_failed', message: 'Check PostgreSQL, private Storage, migrations and environment configuration' }));
  process.exit(1);
});
