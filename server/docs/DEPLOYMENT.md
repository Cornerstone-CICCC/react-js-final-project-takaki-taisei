# Local development and Render deployment

## Local development

Use Node 24.13.1 and npm lockfiles. Keep Prisma pinned to 6.19.3. Copy
`server/.env.example` to `.env` and configure PostgreSQL, a private bucket, its
server secret key, strict TLS CA path, explicit frontend origins and a strong JWT
secret. Never use `VITE_` for privileged keys. Existing local `.env` is already
configured for the verified project and is ignored by Git.

```sh
cd server
npm ci
npm run prisma:deploy
npm run build
npm run dev
```

In another shell, `cd client && npm ci && npm run dev`. The client API URL is
`http://localhost:4000/api`. No Supabase browser client or Auth JWKS is needed.
Startup refuses SQLite URLs, weak JWT secrets, wildcard CORS, non-private buckets,
missing migrations and binary nodes without Storage references. Keep application
writes stopped when running legacy migration integrity comparisons.

## Tests

```sh
cd server
npm run typecheck
npm test
# This must point to a disposable LOCAL PostgreSQL instance with CREATE DATABASE.
TEST_DATABASE_ADMIN_URL=postgresql://USER@127.0.0.1:5432/postgres npm run test:integration
npx playwright install chromium
RUN_BROWSER_TESTS=yes TEST_DATABASE_ADMIN_URL=postgresql://USER@127.0.0.1:5432/postgres npm run test:integration
cd ../client
npm run lint
npm run build
```

The runner refuses remote hosts, creates a uniquely named test database, applies
both migrations and drops only that database. Supabase is represented by a local
HTTP fault-injection server in tests; original user data and objects are never
deleted by the suite. Browser tests run Vite on port 5173, which must be free.
Unit tests cover source validation and migration retry/conflict behavior. Live
GET-only checks are separate (`scripts/verify-live.ts`). No backend ESLint setup
existed; backend `lint` is explicitly a TypeScript check, while frontend ESLint is
run normally. GitHub Actions runs unit, isolated integration and Chromium tests;
it contains no deployment step and requires no production secrets.

## Render handoff — prepared, not deployed

`render.yaml` defines one paid Starter Node web service with automatic deployment
disabled. Serving React from Express keeps authentication same-origin, including
Secure/SameSite=Lax cookies. A paid plan supports `preDeployCommand`; provision it
only after explicit approval. No service or paid resource has been created.

Before an approved deployment:

1. Connect the repository/feature branch in Render. Upload the public database CA
   as a secret file named `supabase-ca.crt` at `/etc/secrets/supabase-ca.crt`.
2. Configure `DATABASE_URL` with the direct/session endpoint and
   `sslmode=require&sslaccept=strict&sslcert=/etc/secrets/supabase-ca.crt&connection_limit=5`.
   Keep credentials out of the blueprint. Supabase's IPv4 session pooler may be
   necessary if the selected Render network cannot reach the direct IPv6 endpoint.
3. Set `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and `CORS_ORIGIN` to the exact HTTPS
   origin assigned to this service. The blueprint generates `JWT_SECRET` once.
   Use the same JWT secret on every instance and preserve it across restarts.
4. Review the proxy/rate-limit constraints in ARCHITECTURE.md and set ingress
   request/memory limits. Monitor cleanup backlog and API errors. Keep the Storage
   bucket private and apply a matching 10 MiB bucket upload cap if desired; the
   application already enforces the cap. Configure Supabase backup retention and
   separate object backups according to your recovery requirements.
5. Build installs both lockfiles, generates Prisma and builds React with `/api`.
   Pre-deploy runs only additive `prisma migrate deploy`, never legacy data copy,
   seed/reset or BYTEA cleanup. Start serves Express plus `client/dist`.
6. After deployment, verify `/api/ready`, actual signup/login, image/PDF upload,
   download hashes, text edits, logout, restart persistence and cleanup using
   isolated disposable users. Record the actual service URL and results.

`/api/ready` validates PostgreSQL only; Storage is checked during startup and file
operations. Configure separate alerts for Storage errors and stale cleanup jobs.
The graceful shutdown budget is 60 seconds; the blueprint allows 65 seconds.

References: [Render blueprint fields](https://render.com/docs/blueprint-spec),
[Render environment and secret files](https://render.com/docs/configure-environment-variables),
[Supabase connection options](https://supabase.com/docs/guides/database/connecting-to-postgres).
