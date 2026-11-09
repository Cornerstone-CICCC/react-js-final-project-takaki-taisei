import 'dotenv/config';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app';
import { env, validateEnvironment } from '../src/config/env';
import { prisma } from '../src/lib/prisma';
import { checksum, storage } from '../src/lib/storage';
import jwt from 'jsonwebtoken';
// @ts-ignore Shared ESM migration verifier
import { readSource } from './migration-common.mjs';

async function main() {
  validateEnvironment();
  await prisma.$connect(); await storage.assertPrivate();
  const source = readSource(process.env.MIGRATION_SOURCE_DB);
  assert.equal(await prisma.user.count(), source.users.length);
  assert.equal(await prisma.node.count(), source.nodes.length);
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as any).port}/api`;
  const cookie = (userId: string) => 'auth_token=' + jwt.sign({ userId }, env.jwtSecret, { expiresIn: '1m' });
  let binaries = 0, texts = 0;
  try {
    assert.equal((await fetch(base + '/tree')).status, 401);
    for (const user of source.users) {
      assert.equal((await fetch(base + '/tree', { headers: { cookie: cookie(user.id) } })).status, 200);
    }
    for (const node of source.nodes.filter((n: any) => n.type === 'FILE')) {
      const response = await fetch(base + `/nodes/${node.id}/raw`, { headers: { cookie: cookie(node.ownerId) } });
      assert.equal(response.status, 200);
      const actual = Buffer.from(await response.arrayBuffer());
      const expected = node.data === null ? Buffer.from(node.content) : Buffer.from(node.data);
      assert.equal(checksum(actual), checksum(expected));
      if (node.data === null) texts++; else binaries++;
      const other = source.users.find((u: any) => u.id !== node.ownerId);
      assert.equal((await fetch(base + `/nodes/${node.id}/raw`, { headers: { cookie: cookie(other.id) } })).status, 404);
    }
    console.log(JSON.stringify({ liveApi: 'verified', users: source.users.length, nodes: source.nodes.length,
      binaries, texts, originalBytesRetained: true, unauthorizedReads: 'denied', mutationRequests: 0 }));
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }
}
main().catch(async () => { console.error('Live verification failed; no data mutations were requested'); await prisma.$disconnect(); process.exitCode = 1; });
