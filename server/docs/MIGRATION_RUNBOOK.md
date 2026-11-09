# Migration, recovery and deferred cleanup

Run commands from `server/`. Never run reset/seed against the migrated database.
The npm migration commands load ignored `.env` through a launcher and spawn Node
with the configured CA already in its environment. Commit flags default to off.
Do not put database passwords in command arguments, shell history, logs or chat.

## SQLite to PostgreSQL

Stop all SQLite writers, rotate the previously disclosed database password and
take an independent SQLite online backup while writers remain stopped. Keep the
original and backup unchanged. Configure `MIGRATION_SOURCE_DB`,
`MIGRATION_ORIGINAL_DB` (default `prisma/dev.db`), `MIGRATION_TARGET_DB`, and
`NODE_EXTRA_CA_CERTS` securely. Rotation/writer confirmations are explicit operator
assertions, not automated proof that a credential changed.

```sh
MIGRATION_PASSWORD_ROTATED=yes MIGRATION_WRITES_STOPPED=yes npm run migrate:preflight
npm run migrate:sqlite
MIGRATION_PASSWORD_ROTATED=yes MIGRATION_WRITES_STOPPED=yes MIGRATION_COMMIT=yes npm run migrate:sqlite
npm run migrate:verify
```

Preflight validates SQLite integrity/foreign keys, timestamps, body types, owner
and parent relationships, root counts, hierarchy cycles, backup logical equality,
CA validity and an empty target. The migration locks both destination tables and
copies within one transaction. Every legacy column, including password hashes,
timestamps, binary hashes and text, is compared before COMMIT and again afterward.

If a network failure makes COMMIT outcome ambiguous, inspect target counts and
run `migrate:verify` first. Never delete rows or blindly rerun: the copy refuses a
nonempty destination. Recover into a separate database if reconciliation is needed.

## PostgreSQL bytes to private Storage

Keep application writers stopped and BYTEA intact. `user-files` must already exist
and be private. Configure `SUPABASE_URL`, server-only `SUPABASE_SECRET_KEY`, and
`SUPABASE_STORAGE_BUCKET`. The script holds a migration session advisory lock.

```sh
npm run migrate:storage
MIGRATION_WRITES_STOPPED=yes STORAGE_MIGRATION_COMMIT=yes npm run migrate:storage
npm run migrate:storage
npm run migrate:verify
```

Default mode is genuinely read-only: it inspects available objects without uploads
or metadata changes. Commit mode uses deterministic owner/node keys and no overwrite.
Only a confirmed missing object permits upload. Every existing/uploaded object is
downloaded and SHA-256/size checked before setting `storageKey`. The raw SQL update
preserves `updatedAt` and other legacy fields. A DB failure after upload leaves a
deterministically discoverable object; retry verifies it and links it. A checksum
conflict fails without modifying/deleting the object. Final prefix enumeration
detects unexpected migration objects. A successful second run creates no duplicates.

Switch `DATABASE_URL` to PostgreSQL with strict TLS and a bounded connection pool.
Run `npm run prisma:deploy` to add the cleanup table, then `npm run build` and start.
`node --import tsx scripts/verify-live.ts` performs GET-only API checks against all
source files using short-lived operator-generated test JWTs. It never requires or
prints original user passwords. This verifies authorization/download behavior;
actual password login is covered with isolated test users.

## Backup and restore

Preserve the original SQLite database and the verified migration backup. Before
any destructive maintenance, take a PostgreSQL custom-format dump and a separate
Storage object backup plus manifest (node ID, owner, key, size, SHA-256). PostgreSQL
backups do not back up Storage bytes. Protect all backups as sensitive user data.
Use libpq connection settings from a secure password file/environment, not command
arguments; `PGSSLMODE=verify-full` and `PGSSLROOTCERT` must validate the certificate.
Verify a dump with `pg_restore --list`, restore it into an **isolated** database,
and compare metadata and object hashes. A readable dump alone is not a restore test.

Before accepting new writes, rollback can restore the preserved SQLite source to
a separate legacy deployment. Once new PostgreSQL/Storage writes exist, that source
is stale: freeze writes and export/reconcile the new records and objects before
rolling back. Never point legacy code at PostgreSQL or discard post-cutover writes.

For cleanup worker failures, resolve Storage credentials/connectivity, inspect the
durable jobs and allow automatic retry. Do not delete a job until its object was
removed or it is proven referenced. For migration failures, keep the deterministic
objects and source BYTEA; use the migration verifier and retry, not the runtime
cleanup worker. Runtime jobs never scan migration prefixes on their own.

## Destructive BYTEA cleanup — NOT executed

Explicit user approval is still required. Keep this outside automatic deployment
migrations. First freeze writes, verify independent database/object backups and a
restore drill, verify every binary object's SHA-256 and size again, and test the
runtime with no BLOB reads. Retain a pre-cleanup PostgreSQL dump with BYTEA.

The proposed data phase is an explicit transaction that sets `Node.data = NULL`
only for verified binary IDs and keys from the manifest. Check affected row count
against that manifest, re-read every Storage object, then commit. On any mismatch,
roll back. The schema phase is a later migration dropping `Node.data` and regenerating
Prisma after an observation period. Do not combine those steps with this release.

Rollback of data cleanup restores BYTEA by ID from an isolated restored dump,
without overwriting new metadata or timestamps. Rollback after dropping the column
first reintroduces nullable BYTEA, then restores the verified legacy bytes. Neither
rollback requires deleting Storage objects or the original SQLite files.
