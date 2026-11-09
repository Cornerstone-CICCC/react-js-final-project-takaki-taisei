import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import bcrypt from 'bcryptjs';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';

test('HTTP API with real isolated PostgreSQL and a fault-injected Storage HTTP server', {
  skip: process.env.TEST_DATABASE_ISOLATED !== 'yes', timeout: 120000,
}, async (t) => {
  assert.match(new URL(process.env.DATABASE_URL!).pathname, /^\/storage_test_/);
  const objects = new Map<string, Buffer>();
  let failUpload = false, failDownload = false, failDelete = false, delayDownload = false;
  let afterUpload: (() => Promise<void>) | undefined;
  const mockStorage = createServer(async (req, res) => {
    const path = decodeURIComponent(req.url!);
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const bytes = Buffer.concat(chunks);
    const json = (status: number, body: unknown) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
    if (path === '/storage/v1/bucket/user-files') return json(200, { id: 'user-files', name: 'user-files', public: false });
    if (req.method === 'DELETE') {
      if (failDelete) return json(503, { message: 'injected delete failure' });
      for (const key of JSON.parse(bytes.toString()).prefixes) objects.delete(key);
      return json(200, []);
    }
    const key = path.replace(/^\/storage\/v1\/object\/(?:authenticated\/)?user-files\//, '');
    if (req.method === 'POST') {
      if (failUpload) return json(503, { message: 'injected upload failure' });
      if (objects.has(key)) return json(409, { message: 'already exists' });
      objects.set(key, bytes);
      await afterUpload?.();
      return json(200, { Key: `user-files/${key}` });
    }
    if (delayDownload) await new Promise((resolve) => setTimeout(resolve, 400));
    if (failDownload) return json(503, { message: 'injected download failure' });
    const value = objects.get(key);
    if (!value) return json(404, { message: 'not found', statusCode: '404' });
    res.writeHead(200, { 'content-type': 'application/octet-stream' }); res.end(value);
  }).listen(0, '127.0.0.1');
  await once(mockStorage, 'listening');
  process.env.SUPABASE_URL = `http://127.0.0.1:${(mockStorage.address() as any).port}`;
  const { createApp } = await import('../src/app');
  const { prisma } = await import('../src/lib/prisma');
  const { processStorageCleanup } = await import('../src/services/storageCleanup.service');
  const { storage } = await import('../src/lib/storage');
  await storage.assertPrivate();
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as any).port}/api`;
  const request = (path: string, cookie = '', method = 'GET', body?: unknown, headers = {}) => fetch(base + path, {
    method, headers: { cookie, ...(body ? { 'content-type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = async (response: Response, status = 200) => { assert.equal(response.status, status); return (await response.json()).data; };
  const upload = (cookie: string, name: string, bytes: Buffer, mime = 'application/pdf', parentId = 'root') => {
    const form = new FormData(); form.append('file', new Blob([new Uint8Array(bytes)], { type: mime }), name); form.append('parentId', parentId);
    return fetch(base + '/nodes/upload', { method: 'POST', headers: { cookie }, body: form });
  };
  let a = '', b = '', userId = '', folder: any, nested: any, text: any, binary: any;
  const pdf = Buffer.from('%PDF-1.7\nfixture');
  const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
  try {
    await t.test('registration, hashing, login, invalid credentials and unauthorized requests', async () => {
      assert.equal((await request('/tree')).status, 401);
      assert.equal((await request('/auth/login', '', 'POST', {})).status, 400);
      for (const who of ['a', 'b']) {
        const res = await request('/auth/signup', '', 'POST', { username: who, email: `${who}@example.test`, password: 'test-password-123' });
        const user = await data(res, 201);
        const cookie = res.headers.get('set-cookie')!.split(';')[0];
        if (who === 'a') { a = cookie; userId = user.id; } else b = cookie;
        assert.equal(user.passwordHash, undefined);
      }
      const saved = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
      assert.ok(await bcrypt.compare('test-password-123', saved.passwordHash));
      assert.notEqual(saved.passwordHash, 'test-password-123');
      await data(await request('/auth/login', '', 'POST', { email: 'a@example.test', password: 'test-password-123' }));
      assert.equal((await request('/auth/login', '', 'POST', { email: 'a@example.test', password: 'wrong' })).status, 401);
      await data(await request('/auth/me', a));
      assert.equal((await request('/nodes', a, 'POST', { name: 'blocked', type: 'FOLDER' }, { origin: 'https://evil.example' })).status, 403);
    });
    await t.test('nested folders, Unicode and empty text, rename and cycle prevention', async () => {
      folder = await data(await request('/nodes', a, 'POST', { name: 'Documents', type: 'FOLDER' }), 201);
      nested = await data(await request('/nodes', a, 'POST', { name: 'Nested', type: 'FOLDER', parentId: folder.id }), 201);
      text = await data(await request('/nodes', a, 'POST', { name: '日本語.txt', type: 'FILE', parentId: nested.id, content: 'こんにちは🌏' }), 201);
      assert.equal((await data(await request(`/nodes/${text.id}`, a))).content, 'こんにちは🌏');
      await data(await request(`/nodes/${text.id}`, a, 'PATCH', { content: '' }));
      assert.equal((await data(await request(`/nodes/${text.id}`, a))).content, '');
      await data(await request(`/nodes/${folder.id}`, a, 'PATCH', { name: 'Renamed' }));
      assert.equal((await request(`/nodes/${folder.id}/move`, a, 'POST', { parentId: nested.id })).status, 400);
      assert.equal((await request(`/nodes/${folder.id}/move`, a, 'POST', { parentId: folder.id })).status, 400);
      assert.equal((await request('/nodes', a, 'POST', { name: 'bad', type: 'FILE', parentId: text.id })).status, 400);
      assert.equal((await request('/nodes', a, 'POST', { name: 'bad', type: 'FILE', parentId: 'missing' })).status, 404);
      assert.ok((await data(await request('/search?q=renamed', a))).length);
    });
    await t.test('concurrent reciprocal moves cannot create a cycle', async () => {
      const left = await data(await request('/nodes', a, 'POST', { name: 'Left', type: 'FOLDER' }), 201);
      const right = await data(await request('/nodes', a, 'POST', { name: 'Right', type: 'FOLDER' }), 201);
      const results = await Promise.all([
        request(`/nodes/${left.id}/move`, a, 'POST', { parentId: right.id }),
        request(`/nodes/${right.id}/move`, a, 'POST', { parentId: left.id }),
      ]);
      assert.deepEqual(results.map((r) => r.status).sort(), [200, 400]);
      await data(await request('/tree', a));
    });
    await t.test('uploads/downloads image and PDF preserve hashes; metadata contains no bytes or keys', async () => {
      binary = await data(await upload(a, 'sample.pdf', pdf, 'application/pdf', nested.id), 201);
      for (const [name, bytes, mime] of [['image.png', Buffer.from('89504e470d0a1a0a00000000', 'hex'), 'image/png'], ['second.pdf', pdf, 'application/pdf']] as const) {
        const file = await data(await upload(a, name, bytes, mime, nested.id), 201);
        assert.equal(file.storageKey, undefined); assert.equal(file.data, undefined);
        const response = await request(`/nodes/${file.id}/raw`, a);
        assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), mime);
        assert.equal(Number(response.headers.get('content-length')), bytes.length);
        assert.equal(hash(Buffer.from(await response.arrayBuffer())), hash(bytes));
        assert.equal((await prisma.node.findUniqueOrThrow({ where: { id: file.id } })).data, null);
      }
      assert.equal((await upload(a, 'spoof.png', pdf, 'image/png')).status, 400);
      assert.equal((await upload(a, 'big.bin', Buffer.alloc(10 * 1024 * 1024 + 1), 'application/octet-stream')).status, 413);
      assert.equal((await upload(a, 'sample.pdf', pdf, 'application/pdf', nested.id)).status, 409);
      assert.equal((await request('/nodes/upload', a, 'POST', {})).status, 400);
    });
    await t.test('owner isolation across read, download, edit, delete, create and move', async () => {
      for (const [path, method, body] of [[`/nodes/${binary.id}`, 'GET', undefined], [`/nodes/${binary.id}/raw`, 'GET', undefined], [`/nodes/${text.id}`, 'PATCH', { content: 'hacked' }], [`/nodes/${folder.id}`, 'DELETE', undefined], ['/nodes', 'POST', { name: 'hacked', type: 'FILE', parentId: folder.id }], [`/nodes/${text.id}/move`, 'POST', { parentId: 'root' }]] as const) {
        assert.equal((await request(path, b, method, body)).status, 404);
      }
      assert.equal((await upload(b, 'hacked.pdf', pdf, 'application/pdf', folder.id)).status, 404);
      const other = await data(await request('/nodes/root', b));
      assert.equal((await request(`/nodes/${text.id}/move`, a, 'POST', { parentId: other.id })).status, 404);
    });
    await t.test('Storage failures, timeout, missing object and invalid key return safe errors', async () => {
      failUpload = true; assert.equal((await upload(a, 'failed.pdf', pdf)).status, 503); failUpload = false;
      failDownload = true; assert.equal((await request(`/nodes/${binary.id}/raw`, a)).status, 503); failDownload = false;
      delayDownload = true; assert.equal((await request(`/nodes/${binary.id}/raw`, a)).status, 503); delayDownload = false;
      const node = await prisma.node.findUniqueOrThrow({ where: { id: binary.id } });
      objects.delete(node.storageKey!); assert.equal((await request(`/nodes/${binary.id}/raw`, a)).status, 503); objects.set(node.storageKey!, pdf);
      await prisma.node.update({ where: { id: binary.id }, data: { storageKey: 'other/invalid/key' } });
      assert.equal((await request(`/nodes/${binary.id}/raw`, a)).status, 500);
      await prisma.node.update({ where: { id: binary.id }, data: { storageKey: node.storageKey } });
    });
    await t.test('successful upload followed by DB constraint failure leaves a recoverable intent', async () => {
      afterUpload = async () => {
        const root = await prisma.node.findFirstOrThrow({ where: { ownerId: userId, parentId: null } });
        await prisma.node.create({ data: { name: 'race.pdf', type: 'FILE', content: '', ownerId: userId, parentId: root.id } });
      };
      const before = objects.size;
      assert.equal((await upload(a, 'race.pdf', pdf)).status, 409);
      afterUpload = undefined;
      assert.equal(objects.size, before + 1);
      assert.ok(await prisma.storageCleanup.count());
      await prisma.storageCleanup.updateMany({ data: { nextAttemptAt: new Date(0) } });
      await processStorageCleanup();
      assert.equal(objects.size, before);
    });
    await t.test('database INSERT failure after Storage success rolls back metadata and retains cleanup', async () => {
      await prisma.$executeRawUnsafe(`CREATE FUNCTION fail_test_upload() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.name = 'db-failure.pdf' THEN RAISE EXCEPTION 'injected failure'; END IF; RETURN NEW; END $$`);
      await prisma.$executeRawUnsafe('CREATE TRIGGER test_upload_failure AFTER INSERT ON "Node" FOR EACH ROW EXECUTE FUNCTION fail_test_upload()');
      const before = objects.size;
      try {
        assert.equal((await upload(a, 'db-failure.pdf', pdf)).status, 500);
        assert.equal(await prisma.node.count({ where: { name: 'db-failure.pdf' } }), 0);
        assert.equal(objects.size, before + 1);
        await prisma.storageCleanup.updateMany({ data: { nextAttemptAt: new Date(0) } });
        await processStorageCleanup();
        assert.equal(objects.size, before);
      } finally {
        await prisma.$executeRawUnsafe('DROP TRIGGER test_upload_failure ON "Node"');
        await prisma.$executeRawUnsafe('DROP FUNCTION fail_test_upload()');
      }
    });
    await t.test('recursive delete commits cleanup jobs, retries failures and removes only deleted objects', async () => {
      failDelete = true;
      await data(await request(`/nodes/${folder.id}`, a, 'DELETE'));
      assert.equal((await request(`/nodes/${binary.id}`, a)).status, 404);
      await processStorageCleanup();
      assert.ok(await prisma.storageCleanup.count()); assert.ok(objects.size);
      failDelete = false;
      await prisma.storageCleanup.updateMany({ data: { nextAttemptAt: new Date(0) } });
      await processStorageCleanup(); await processStorageCleanup();
      assert.equal(await prisma.storageCleanup.count(), 0); assert.equal(objects.size, 0);
      assert.equal((await request('/nodes/root', a, 'DELETE')).status, 400);
    });
    await t.test('PostgreSQL reconnect preserves data and health checks work', async () => {
      await prisma.$disconnect();
      await data(await request('/nodes/root', a));
      assert.equal((await request('/health')).status, 200);
      assert.equal((await request('/ready')).status, 200);
      assert.equal((await request('/auth/logout', a, 'POST')).status, 200);
    });
    await t.test('startup rejects a failed database connection without exposing credentials', async () => {
      const broken = new URL(process.env.DATABASE_URL!); broken.port = '1'; broken.password = 'do-not-log-this-test-password';
      const child = spawn(process.execPath, ['dist/server.js'], { env: { ...process.env, DATABASE_URL: broken.toString() }, stdio: ['ignore', 'pipe', 'pipe'] });
      let output = '';
      child.stdout.on('data', (chunk) => { output += chunk; }); child.stderr.on('data', (chunk) => { output += chunk; });
      const [code] = await once(child, 'exit');
      assert.equal(code, 1); assert.match(output, /startup_failed/); assert.doesNotMatch(output, /do-not-log-this-test-password/);
    });
    await t.test('Chromium: login, folder navigation, text editing, upload, download, delete and refresh', {
      skip: process.env.RUN_BROWSER_TESTS !== 'yes', timeout: 60000,
    }, async () => {
      const { chromium } = await import('playwright');
      // Same-site deployment on separate ports, matching local development.
      const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
        cwd: '../client', env: { ...process.env, VITE_BACKEND_URL: base }, stdio: 'ignore',
      });
      const browser = await chromium.launch({ headless: true });
      try {
        for (let n = 0; n < 50; n++) {
          try { if ((await fetch('http://localhost:5173')).ok) break; } catch {}
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        // Use 127.0.0.1 on both origins; CORS config is extended by the runner.
        const page = await browser.newPage();
        page.setDefaultTimeout(10000);
        await page.goto('http://127.0.0.1:5173/login');
        await page.getByLabel('Email', { exact: true }).fill('a@example.test');
        await page.getByLabel('Password', { exact: true }).fill('wrong-password');
        await page.getByRole('button', { name: 'Log In', exact: true }).click();
        await page.getByText('Invalid email or password', { exact: true }).waitFor();
        await page.getByLabel('Password', { exact: true }).fill('test-password-123');
        await page.getByRole('button', { name: 'Log In', exact: true }).click();
        await page.waitForURL('**/dashboard');
        await page.getByRole('button', { name: 'New Folder', exact: true }).click();
        await page.getByLabel('Folder Name', { exact: true }).fill('Browser folder');
        await page.getByRole('button', { name: 'Create', exact: true }).click();
        await page.getByRole('heading', { name: 'Browser folder', exact: true }).click();
        // Create text through the public API; editing and persistence use the UI.
        const root = await prisma.node.findFirstOrThrow({ where: { ownerId: userId, name: 'Browser folder' } });
        await data(await request('/nodes', a, 'POST', { name: 'browser.txt', type: 'FILE', content: 'before', parentId: root.id }), 201);
        await page.reload();
        // Existing dashboard restores root on reload; navigate back into the folder.
        await page.getByRole('heading', { name: 'Browser folder', exact: true }).click();
        await page.getByRole('button', { name: 'Open browser.txt', exact: true }).click();
        await page.getByRole('button', { name: 'Edit text', exact: true }).click();
        await page.getByLabel('Text content', { exact: true }).fill('Edited 日本語🌏');
        await page.getByRole('button', { name: 'Save text', exact: true }).click();
        await page.getByText('Edited 日本語🌏', { exact: true }).waitFor();
        await page.getByRole('button', { name: 'Close preview', exact: true }).click();
        await page.getByRole('button', { name: 'Upload', exact: true }).click();
        await page.locator('input[type=file]').setInputFiles({ name: 'browser.pdf', mimeType: 'application/pdf', buffer: pdf });
        await page.getByRole('dialog').getByRole('button', { name: 'Upload', exact: true }).click();
        await page.getByRole('button', { name: 'Open browser.pdf', exact: true }).click();
        const pendingDownload = page.waitForEvent('download');
        await page.getByRole('link', { name: 'Download', exact: true }).click();
        const download = await pendingDownload;
        assert.equal(hash(await readFile((await download.path())!)), hash(pdf));
        await page.getByRole('button', { name: 'Close preview', exact: true }).click();
        await page.getByRole('button', { name: 'Delete browser.pdf', exact: true }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
        await page.getByRole('button', { name: 'Open browser.pdf', exact: true }).waitFor({ state: 'detached' });
        await page.reload();
        await page.getByRole('heading', { name: 'Browser folder', exact: true }).waitFor();
        assert.equal((await prisma.node.findFirstOrThrow({ where: { ownerId: userId, name: 'browser.txt' } })).content, 'Edited 日本語🌏');
      } finally { await browser.close(); vite.kill('SIGTERM'); }
    });
  } finally {
    await prisma.$disconnect();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await new Promise<void>((resolve) => mockStorage.close(() => resolve()));
  }
});
