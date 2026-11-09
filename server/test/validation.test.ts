import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nameSchema, moveNodeSchema } from '../src/validation/node.schema';
import { signupSchema } from '../src/validation/auth.schema';
import { assertStorageKey } from '../src/lib/storage';
import { detectMime, MAX_UPLOAD_BYTES } from '../src/validation/binary';
import { EventEmitter } from 'node:events';
import { transferLimit } from '../src/middleware/transferLimit';

test('rejects traversal, control characters, oversized names and unsafe IDs', () => {
  for (const name of ['../x', '..', '.', 'a\\b', 'a\nb', 'x'.repeat(256), '']) assert.equal(nameSchema.safeParse(name).success, false);
  assert.equal(nameSchema.parse(' 日本語.txt '), '日本語.txt');
  assert.equal(moveNodeSchema.safeParse({ parentId: '../../user' }).success, false);
  assert.throws(() => assertStorageKey('other/node/object', 'owner', 'node'));
  assert.throws(() => assertStorageKey('owner/node/../file', 'owner', 'node'));
  assertStorageKey('owner/node/legacy-v1', 'owner', 'node');
});
test('recognizes signatures, rejects spoofed MIME and caps bytes', () => {
  assert.equal(detectMime(Buffer.from('%PDF-1.7'), 'application/pdf'), 'application/pdf');
  assert.equal(detectMime(Buffer.from('<script>x</script>'), 'text/html'), 'application/octet-stream');
  assert.throws(() => detectMime(Buffer.from('html'), 'image/png'));
  assert.throws(() => detectMime(Buffer.alloc(MAX_UPLOAD_BYTES + 1), 'application/octet-stream'));
  assert.throws(() => detectMime(Buffer.alloc(0), 'text/html\r\nX: y'));
});
test('bcrypt password limit is measured in UTF-8 bytes', () => {
  assert.equal(signupSchema.safeParse({ username: 'test', email: 'a@example.com', password: 'あ'.repeat(25) }).success, false);
});
test('disconnected clients cannot bypass active transfer capacity', () => {
  const responses: any[] = [];
  for (let i = 0; i < 4; i++) {
    const response = Object.assign(new EventEmitter(), { locals: {}, destroyed: false });
    transferLimit({} as any, response as any, (error) => assert.equal(error, undefined));
    (response.locals as any).transferLease.start();
    response.destroyed = true; response.emit('close'); responses.push(response);
  }
  transferLimit({} as any, {} as any, (error: any) => assert.equal(error.statusCode, 503));
  for (const response of responses) response.locals.transferLease.done();
  const response = Object.assign(new EventEmitter(), { locals: {}, destroyed: false });
  transferLimit({} as any, response as any, (error) => assert.equal(error, undefined));
  response.emit('finish');
});
