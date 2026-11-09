# Storage App architecture

React calls Express using an HttpOnly JWT cookie. Express checks ownership on every
node operation. Prisma 6 connects to Supabase PostgreSQL; the server-only Supabase
SDK accesses the private `user-files` bucket. Supabase Auth, its JWKS endpoint and
its publishable key are not part of application authentication. The Data API is
not required. Preserve the existing bcrypt password hashes and user IDs.

## Data and object layout

`User` stores identity, bcrypt hashes and timestamps. `Node` stores owner/parent,
name, type, text content, MIME, byte size, timestamps and a unique nullable
`storageKey`. The original `data BYTEA` column is retained as a recovery copy;
runtime services never select or write it. The legacy SQLite schema and database
remain available for recovery. `StorageCleanup` is a durable outbox with no node
foreign key, so jobs survive metadata deletion.

Migrated objects use `ownerId/nodeId/legacy-v1`. New objects use
`ownerId/UUID/UUID`. Both identifiers are validated; original filenames never
become path components. Renaming or moving a file changes only metadata.

PostgreSQL provides transactional metadata and efficient text editing; object
storage avoids repeatedly loading BLOB columns into metadata queries. The two
services cannot participate in one transaction, so compensation and retries are
explicit parts of the design.

## Authentication and authorization

Passwords use bcrypt cost 12. Registration rejects more than 72 UTF-8 bytes to
avoid bcrypt truncation; login still accepts existing passwords. JWT verification
is restricted to HS256. A strong stable JWT secret is required at startup.
Cookies use HttpOnly, SameSite=Lax, and Secure in production. Mutation requests
with an unapproved Origin or cross-site Fetch Metadata are rejected. Production
serves React and the API from one Render origin; no third-party cookie dependency.

Node queries are owner scoped. Parent checks reject foreign or non-folder parents.
Root mutation and hierarchy cycles are rejected. Every hierarchy mutation holds
a PostgreSQL transaction advisory lock for its owner; this prevents concurrent
moves from creating cycles and recursive deletes from missing new children.
These guarantees apply to application writes; direct database writes must obey
the same rules and should not be used for normal file management.

## Upload and recovery

1. Authenticate before parsing multipart data. Enforce 10 MiB, one file, bounded
   fields, safe names and IDs. Inspect supported image/PDF signatures. Other bytes
   are stored as `application/octet-stream`; browser MIME claims are untrusted.
2. Under the owner lock, validate parent/name and persist a cleanup intent whose
   eligibility is one hour away. No remote bytes are sent before this commits.
3. Upload with `upsert: false`, download, and compare SHA-256.
4. Under the same owner lock, revalidate the parent/name and unexpired intent,
   insert Node metadata, and consume the intent in one transaction.

A failed/ambiguous upload or metadata write leaves a durable intent. The worker
eventually removes the unreferenced object. It never deletes a referenced object,
and failed deletes retain the job for retry. If a metadata COMMIT succeeds but its
response is lost, the object remains referenced and the intent was atomically
removed. Repeating an upload with the same sibling name returns 409; callers can
refresh the folder to discover an upload whose response was lost. This is not an
idempotency-key API. A duplicate simultaneous upload can briefly create an extra
object, but its durable intent is subsequently reconciled.

Uploads have a 30-second per-operation network timeout. One-hour intents provide
ample recovery time. Extremely delayed external writes after this window require
operator reconciliation; bucket lifecycle policies must not independently remove
referenced objects. Four concurrent transfers per process bound normal buffered
file memory, holding transfer slots until in-flight work finishes even if a client
disconnects. Deployment memory limits and ingress limits remain necessary. Larger files would
justify streaming/resumable uploads; they are intentionally outside this API.

## Download and delete

Express checks ownership, validates the key's owner/node prefix, downloads the
private object and verifies its size before responding. Proxying preserves the
existing cookie-authorized raw URLs and avoids a signed-URL access window after
deletion. It costs backend bandwidth and memory compared with signed URLs.
`?download=1` sets attachment disposition, including across origins. Text is served
as plain text, unsafe formats as attachments, with nosniff, no-store and a sandbox
Content Security Policy. Signature recognition is not malware scanning.

Recursive deletion enumerates the owner's descendants while holding the owner
lock, enqueues their object keys and deletes metadata in the same transaction.
The API returns once that transaction commits. Objects remain private until the
30-second cleanup worker removes them. Each deletion is retryable with exponential
backoff up to one hour; keys/ownership and live references are checked again.
Monitor job count, oldest `createdAt`, attempts and `storage_cleanup_failed` events.
No arbitrary bucket-wide deletion or original-object cleanup occurs during tests.

## Operational constraints

Use a direct endpoint or Supavisor **session** pooler with Prisma 6, a small
`connection_limit` and enough capacity for every web instance. Transaction pooling
requires separate evaluation/configuration, especially for administrative tools
and session advisory locks used by migration scripts. TLS validation is mandatory:
Prisma requires `sslmode=require&sslaccept=strict&sslcert=/absolute/ca/path`.
Node migration clients use the CA via `NODE_EXTRA_CA_CERTS` at process startup.
The migration launcher loads `.env` and then spawns Node so the CA is actually used.

`/api/health` checks process liveness; `/api/ready` checks PostgreSQL. Startup also
checks bucket privacy, the cleanup table and missing binary references. Readiness
does not continually probe Storage; monitor Storage failures separately. SIGTERM
drains HTTP requests and the cleanup worker before disconnecting Prisma.

Rate limiting is per process, keyed to the direct peer IP. Proxy trust is not
enabled implicitly: behind Render this may group requests under the proxy IP.
Before scaling, configure a verified proxy trust boundary and a shared rate-limit
store or ingress limits. Do not trust arbitrary X-Forwarded-For headers.

References: [Supabase keys](https://supabase.com/docs/guides/api/api-keys),
[private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals),
[Prisma 6 PostgreSQL TLS](https://docs.prisma.io/docs/orm/v6/overview/databases/postgresql).
