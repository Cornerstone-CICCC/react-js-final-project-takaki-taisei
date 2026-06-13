# Pseudo File System — API (server)

A virtual file system REST API. Folders and files are **simulated** in a database — no
real OS files are ever touched. Built with **Express + TypeScript + Prisma + SQLite**,
following an MVC structure (routes → controllers → services).

## Stack

- **Express 5** (TypeScript)
- **Prisma ORM** + **SQLite** (zero-setup file database)
- **Zod** for request validation
- **JWT** authentication in HTTP-only cookies
- **bcryptjs** for password hashing
- **tsx** for the dev runtime

## Getting started

```bash
cd server
npm install          # install deps + generate the Prisma client
npm run setup        # create the SQLite DB, run the migration, and seed sample data
npm run dev          # start the API on http://localhost:4000 (watch mode)
```

> `npm run setup` is a one-time step (`prisma migrate dev` + seed). After that, just `npm run dev`.

**Verifying it works:** follow [`CHECKLIST.md`](./CHECKLIST.md) — a step-by-step manual
checklist covering every endpoint, the binary upload/raw flow, and all error guards.
The interactive Swagger UI at http://localhost:4000/api/docs makes each step a click.

Handy scripts:

| Script                  | What it does                               |
| ----------------------- | ------------------------------------------ |
| `npm run dev`           | Start the API in watch mode                |
| `npm run build`         | Type-check + compile to `dist/`            |
| `npm start`             | Run the compiled server (`dist/server.js`) |
| `npm run seed`          | Re-seed sample folders/files (idempotent)  |
| `npm run db:reset`      | Drop, re-migrate, and re-seed the database |
| `npm run prisma:studio` | Open Prisma Studio to inspect the DB       |

## Data model

A single self-referential `Node` table models both folders and files:

| Field      | Notes                                                       |
| ---------- | ----------------------------------------------------------- |
| `id`       | `cuid` (`root` is an API alias for the current user's root) |
| `name`     | unique among siblings in the same folder                    |
| `type`     | `"FILE"` or `"FOLDER"`                                      |
| `content`  | **text** body — for text files (`null` for folders/binary)  |
| `data`     | **binary** body (BLOB) — for uploaded files like PNG        |
| `mimeType` | MIME type, e.g. `image/png`, `text/plain`                   |
| `size`     | byte size of the file body                                  |
| `parentId` | parent folder id (`null` only for the root)                 |

A file is **text** (editable `content`) or **binary** (uploaded `data`, served as-is).
API responses include `isBinary` and a `rawUrl`; the raw bytes are **never** embedded in
JSON (so listing the tree never loads image data). Deleting a folder cascade-deletes its
entire subtree.

## API

Base URL: `http://localhost:4000/api`. All responses are wrapped as `{ "data": ... }`.

**📖 Interactive docs (Swagger UI):** start the server and open
**http://localhost:4000/api/docs** — every endpoint is documented with schemas and a
"Try it out" button. The raw OpenAPI 3 spec is at `http://localhost:4000/api/openapi.json`
(hand this to the frontend; it can also generate a typed client from it).

| Method   | Path              | Description                                       |
| -------- | ----------------- | ------------------------------------------------- |
| `GET`    | `/health`         | Health check                                      |
| `GET`    | `/tree`           | Whole tree as a nested structure                  |
| `GET`    | `/nodes/:id`      | One node + breadcrumb `path` + `children`         |
| `GET`    | `/nodes/:id/raw`  | Stream raw file bytes/text (right `Content-Type`) |
| `POST`   | `/nodes`          | Create a folder or a **text** file                |
| `POST`   | `/nodes/upload`   | Upload a **binary** file (multipart)              |
| `PATCH`  | `/nodes/:id`      | Rename and/or edit text-file content              |
| `POST`   | `/nodes/:id/move` | Move a node into another folder                   |
| `DELETE` | `/nodes/:id`      | Delete a node (folders cascade)                   |
| `GET`    | `/search?q=term`  | Search by name or text content                    |

### Authentication

Authentication uses a signed JWT stored in an HTTP-only cookie named `auth_token`.
Passwords are hashed before storage and are never returned by the API. The `/me` route
uses authentication middleware to verify the cookie.

Add these values to `.env`:

```env
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

The frontend must send requests with credentials enabled. For example:

```ts
fetch("http://localhost:4000/api/auth/me", { credentials: "include" });
```

| Method | Path           | Description                               |
| ------ | -------------- | ----------------------------------------- |
| `POST` | `/auth/signup` | Create an account and set the auth cookie |
| `POST` | `/auth/login`  | Log in and set the auth cookie            |
| `POST` | `/auth/logout` | Clear the auth cookie                     |
| `GET`  | `/auth/me`     | Return the authenticated user             |

Signup body:

```json
{
  "username": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Login body:

```json
{ "email": "john@example.com", "password": "password123" }
```

Successful signup, login, and `/me` responses contain only the public user fields:

```json
{
  "data": {
    "id": "user-id",
    "username": "John Doe",
    "email": "john@example.com"
  }
}
```

### Request bodies

```jsonc
// POST /nodes — create a folder
{ "name": "Music", "type": "FOLDER", "parentId": "root" }

// POST /nodes — create a file (parentId defaults to "root")
{ "name": "hello.txt", "type": "FILE", "content": "hi there" }

// PATCH /nodes/:id — rename and/or edit content
{ "name": "renamed.txt", "content": "new body" }

// POST /nodes/:id/move — move into another folder
{ "parentId": "<folderId>" }
```

### Examples

```bash
curl http://localhost:4000/api/tree
curl -X POST http://localhost:4000/api/nodes \
  -H 'Content-Type: application/json' \
  -d '{"name":"hello.txt","type":"FILE","content":"hi"}'
curl 'http://localhost:4000/api/search?q=todo'

# Upload a binary file (multipart; field name must be "file")
curl -X POST http://localhost:4000/api/nodes/upload \
  -F 'file=@./photo.png;type=image/png' -F 'parentId=root'

# Display/download it (set <img src> to this URL)
curl http://localhost:4000/api/nodes/<id>/raw --output out.png
```

Binary files (max 10 MB) are uploaded via `POST /nodes/upload` and stored as a BLOB in
SQLite. The frontend renders them with `<img src="http://localhost:4000/api/nodes/<id>/raw">`.
Text files keep using `POST /nodes` + `PATCH /nodes/:id`; editing a binary file as text is rejected.

### Validation & errors

Errors are returned as `{ "error": "...", "message": "...", "details"?: [...] }` with an
appropriate status code:

- `400` invalid input (Zod), or an illegal operation (e.g. moving a folder into itself)
- `404` node / route not found
- `409` a sibling with the same name already exists

## Notes for the frontend

CORS is open by default (`CORS_ORIGIN=*` in `.env`). To restrict it to the Vite dev
server, set `CORS_ORIGIN=http://localhost:5173`. Point the React app at
`http://localhost:4000/api`.
