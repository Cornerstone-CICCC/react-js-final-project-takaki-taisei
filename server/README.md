# Storage App API

Express + TypeScript + Prisma 6.19.3 + Supabase PostgreSQL and private Supabase
Storage. React continues to use the cookie-authenticated Express API. Text stays
in PostgreSQL; uploaded binary bodies live in the private `user-files` bucket.
The legacy SQLite database and PostgreSQL BYTEA recovery copies are preserved.

- [Architecture and failure recovery](docs/ARCHITECTURE.md)
- [Migration and backup runbook](docs/MIGRATION_RUNBOOK.md)
- [Local setup, tests and Render deployment](docs/DEPLOYMENT.md)
- [Implementation and verification report](docs/IMPLEMENTATION_REPORT.md)

Start with `.env.example`, then `npm ci`, `npm run prisma:deploy`, `npm run build`
and `npm start`. Runtime requires PostgreSQL and a configured private Storage
bucket; it does not fall back to SQLite. Do not run legacy seed/reset commands
against migrated data. The production deployment is prepared but requires approval.

API routes retain their existing shape under `/api`: `/auth/signup`, `/auth/login`,
`/auth/logout`, `/auth/me`, `/tree`, `/search`, `/nodes`, `/nodes/upload`,
`/nodes/:id`, `/nodes/:id/move`, and `/nodes/:id/raw`. Add `?download=1` to raw URLs
for an attachment response. `/health` reports liveness and `/ready` checks the DB.
Interactive API documentation remains at `/api/docs`.

Run `npm test` for unit tests. Run `npm run test:integration` with an isolated local
`TEST_DATABASE_ADMIN_URL`; set `RUN_BROWSER_TESTS=yes` to include Chromium. See the
linked test guide before running any integration commands.
