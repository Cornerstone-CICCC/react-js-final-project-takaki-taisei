import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

async function main() {
  await prisma.$connect();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`🗂  Pseudo-FS API listening on http://localhost:${env.port}`);
    console.log(`   Health:  http://localhost:${env.port}/api/health`);
    console.log(`   Tree:    http://localhost:${env.port}/api/tree`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down...`);
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
