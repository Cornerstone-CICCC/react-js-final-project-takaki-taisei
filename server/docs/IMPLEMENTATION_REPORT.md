# Storage App migration report — 2026-11-09

## 1. Executive summary

The existing dataset was committed to Supabase PostgreSQL and its 12 binary files
were copied into private Supabase Storage, verified and safely retried. Express
now uses PostgreSQL and Storage. SQLite originals, backups and all legacy BYTEA
remain intact. Runtime, automated API and Chromium checks passed. Render deployment
is prepared, not performed. Destructive BYTEA cleanup is deferred for approval.

## 2. Starting state

Branch: `feat/supabase-postgres-storage`, starting at `bd2bec1`. Existing uncommitted
work included the PostgreSQL schema, initial migration, SQLite migration script,
and `pg` dependency. This work was preserved and extended. The legacy API stored
uploads in SQLite BLOBs and used bcrypt plus a JWT cookie. No tests were present.
After fetching origin, the previous branch remained one commit ahead with
`6836933 add cloudinary`; it was inspected but not merged.

## 3. Final architecture

React → cookie-authenticated Express → Prisma 6.19.3 / PostgreSQL metadata and
text, plus server-only Supabase SDK / private `user-files` objects. Durable
`StorageCleanup` jobs coordinate failed uploads and recursive deletion. See
[architecture](ARCHITECTURE.md) for ownership locks, MIME handling, TLS, pooling,
proxy downloads and operational trade-offs.

## 4. Database migration results — verified live

| Measurement | Source | Committed PostgreSQL |
|---|---:|---:|
| Users | 5 | 5 |
| Nodes | 67 | 67 |
| Folders | 29 | 29 |
| Text files | 26 | 26 |
| Binary files | 12 | 12 |
| Original binary bytes retained | 8,599,862 | 8,599,862 |

SQLite integrity was `ok`; the backup matched the original logically. Backup:
`/data/Projects/elmer_class/react/assignments/storage-app-backups/migration-20261109-041031.db`.
The user confirmed password rotation and stopped writers; independent file
descriptor inspection detected zero SQLite writer processes. The CA at
`/home/takakihashimoto/Downloads/prod-ca-2021.crt` is valid through 2031-04-26.
TLS verification remained enabled. PostgreSQL began with zero users/nodes.

The enhanced dry run rolled back successfully. Authorized COMMIT then succeeded.
Full comparisons before/after COMMIT and after Storage migration verified IDs,
names, types, ownership, parents, text, password hashes, MIME, sizes, timestamps
and binary SHA-256. The additive `0002_storage_cleanup` migration was applied.
No reset, original-database write, seed or destructive schema operation occurred.

## 5. Storage migration results — verified live

The live bucket returned `public: false`. Exactly 12 expected migration objects
were enumerated under their node prefixes. All 12 SHA-256 hashes and byte sizes
matched PostgreSQL/SQLite. Every binary has its deterministic Storage reference.
A second commit-mode run verified the same 12 objects without duplicate uploads.
Final output on both runs: `expected=12, verified=12, bytes=8599862`.
BYTEA and original filenames/owners/timestamps were retained.

## 6. Backend changes — implemented and tested

PostgreSQL schema selection and Prisma generation are explicit. Startup validates
configuration, strict TLS, bucket privacy, migration readiness and references.
Uploads record durable intents, avoid overwrite and verify downloaded hashes.
Downloads check ownership/key scope and size. Recursive deletion queues durable
cleanup in the metadata transaction. Owner transaction locks prevent concurrent
hierarchy races. Errors are sanitized; health/readiness, bounded transfer capacity,
request deadlines and graceful shutdown are included. SQLite is migration-only.

## 7. Frontend changes — implemented and browser tested

The auth API fallback now matches the file API. Errors show useful server messages.
The preview supports editing existing text. Download links request attachment
responses explicitly so cross-origin download behavior works. Production can serve
the React bundle from Express with `/api`, preserving same-origin cookies. Existing
folder, move, rename, upload, preview and delete interfaces were retained. Creating
text files remains available through the existing API; no new creation UI was added.

## 8. Security improvements

Explicit CORS and mutation-origin checks, HS256-only JWT validation, strong startup
secret validation, bcrypt byte-length validation, safe names/IDs/object keys,
signature-based MIME decisions, private/no-store/nosniff responses, bounded multipart
requests, transfer concurrency and rate limits were added. Privileged credentials
are only in ignored `server/.env` (mode 0600); none appear in tracked source or the
client bundle. The previously tracked client environment file is removed from the
index while the local file is retained. The app does not use the supplied JWKS or
publishable key because existing authentication was preserved.

History scanning found no privileged Supabase key or literal Cloudinary secret.
One PostgreSQL URL match was confirmed to be an obvious example in an old vendored
`node_modules/keyv/README.md`. History was not rewritten. The supplied privileged
key was necessarily present in chat; replace it in the dashboard and ignored local/
Render environment before a public launch if that disclosure is outside your
credential-handling policy. Never send replacement credentials through chat.

Compatible HTTP/upload/frontend dependency fixes were applied. Zod was upgraded
to 4.6.7 for its advisory; a scoped deepmerge-ts 8 override repairs Prisma's config
dependency without upgrading Prisma. Generation, migration, builds and tests passed
with those changes. Server npm audit: zero vulnerabilities. Frontend production
audit: zero. Full frontend audit: ten moderate findings in the minimatch/ESLint/
TypeScript-ESLint development tree; no forced major downgrade was applied.

## 9. Automated test results

| Command/check | Result |
|---|---|
| Server `npm run build` (Prisma generate + TypeScript) | Passed |
| Server `npm test` | 6 unit tests passed |
| Isolated PostgreSQL API + Chromium suite | 13 tests passed, zero failures/skips |
| Client `npm run lint` | Passed |
| Client `npm run build` (TypeScript + Vite) | Passed |
| Git whitespace review | Passed with the pre-existing initial migration EOF blank retained to preserve its applied checksum |
| Client bundle/changed-file privileged-key scans | Clean |

Integration tests exercise registration, hashes, valid/invalid login, unauthorized
access, nested folders, Unicode/empty text, rename, moves/cycles (including concurrent
reciprocal moves), image/PDF round trips, MIME/length, oversized/spoofed upload rejection,
cross-owner operations, Storage upload/download/delete failures, timeouts, missing
objects, invalid keys, duplicate-name races, actual database INSERT failure after
upload, cleanup retries and sanitized database-startup failure. Unit tests cover
source integrity, migration partial failures, conflicts, retries and disconnected
client transfer limits. Chromium covers login errors/success, folders, text edits,
upload, hashed download, deletion and authenticated refresh.

Test databases are uniquely created/dropped on localhost; Storage failures use a
local HTTP test server. No original production objects were deleted for testing.
An additional actual restart of the disposable PostgreSQL 16 instance verified
Prisma text, metadata, ownership and hierarchy persistence. GitHub Actions is
prepared; its hosted execution has not yet occurred.

## 10. Running-environment verification

GET-only local API verification against **real Supabase** passed for all 5 users,
67 nodes, 12 binary and 26 text files. Every downloaded body matched the backup;
cross-user raw reads returned 404 and anonymous tree access returned 401.
Operator-generated short-lived JWTs were used; original passwords were never read
in plaintext or required. Original-user password login was not manually exercised;
password hashes were preserved and login was tested with isolated accounts.

The built server started successfully against Supabase. `/api/ready` and
`/api/health` returned 200; `/dashboard` served HTML; unauthenticated API access
returned 401. SIGTERM completed with exit code 0. These are programmatic checks,
not a claim of human acceptance testing or a public deployment.

## 11. Production readiness

Render blueprint, CI, environment examples, migration scripts, startup checks,
failure recovery, backup/restore and deployment documentation are prepared.
The chosen topology uses one Render Node service for React and Express. Read
[deployment instructions](DEPLOYMENT.md) before provisioning. A new post-migration
PostgreSQL dump/object-backup restore drill and operational monitoring are still
required before destructive cleanup. Current independent recovery is the preserved
SQLite backup plus retained BYTEA.

## 12. Deployment status

**Not deployed.** No Render service, paid resource, deployment URL, public release,
main-branch merge or remote push was created. The blueprint disables auto-deploy.
Deployment requires explicit approval, Render account access, CA secret file and
environment configuration. No credentials were invented.

## 13. Git changes

Changes are organized into backend/migration/tests, frontend integration, and
deployment/documentation commits on the existing feature branch. Existing migration
work is included, not discarded. No SQLite files, backups, CA files, privileged
credentials, generated clients, test databases or browser downloads are included.
The original client `.env` remains on disk after it is untracked. Remote Cloudinary
work and main were left unchanged. Commit IDs are listed in the final handoff.

## 14. Remaining risks and limits

- Ten moderate dev-tool audit findings remain; review upstream lint-tool patches.
- Rate limits are per process and direct-peer IP; review trusted proxy and ingress
  behavior on Render before scaling. No shared distributed limit store is installed.
- The API buffers files up to 10 MiB. File signature checks are not malware scanning.
- Cleanup is asynchronous; monitor durable job age/retries and retain object backups.
- Source-wide migration verifiers assume maintenance mode and the original dataset;
  new production writes naturally invalidate exact count comparisons.
- Original Supabase database restart and public Render behavior were not tested;
  restart testing used a disposable PostgreSQL instance.

## 15. Remaining user actions

Approve/provision Render deployment when ready and supply its environment through
the dashboard. Establish scheduled PostgreSQL and separate Storage backups and a
restore drill. Review the development-tool advisories and proxy/rate-limit policy.
Explicitly approve BYTEA cleanup only after the independent recovery prerequisites
in [the runbook](MIGRATION_RUNBOOK.md) are satisfied. Keeping BYTEA for now is safe;
runtime binary operations already use Storage. Do not delete the original SQLite
database or its backup.

## 16. Final completion checklist

| Criterion | Status |
|---|---|
| Original SQLite and backup preserved | Verified |
| All 5 users / 67 nodes migrated with full-field integrity | Verified live |
| All 12 objects / hashes / sizes / owners / hierarchy preserved | Verified live |
| Express PostgreSQL and runtime Storage integration | Implemented and verified |
| Authentication, authorization, upload, download, delete, text editing | Automated API/browser tests passed |
| Persistence across restart | Verified on isolated PostgreSQL |
| Partial failures and Storage retries | Tested |
| Builds, type checks, frontend lint | Passed |
| Privileged credentials excluded from source/bundle | Verified |
| Production configuration and documentation | Prepared |
| Git review and organized local commits | Completed; see final handoff |
| Original data loss | None detected by full comparison |
| Public Render deployment | Pending explicit approval/configuration |
| Destructive BYTEA cleanup | Deferred; not approved or executed |
| Backup restore drill / operational monitoring | Production handoff work |

The migration and implementation are complete; this report does not claim public
deployment, destructive cleanup, human acceptance or zero remaining operational work.
