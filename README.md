# TaskFlow

A task management system with authentication, projects, and tasks. Users can register, log in, create projects, add tasks, and assign them.

---

## 1. Overview

**Tech stack:**

| Layer | Technology |
|---|---|
| Backend | Node.js · TypeScript · Express |
| ORM / Migrations | TypeORM (synchronize: false, explicit migrations) |
| Database | PostgreSQL 15 |
| Auth | JWT (24h expiry) · bcrypt (cost 12) |
| Validation | Zod |
| Logging | Pino (structured JSON in prod, pretty in dev) |
| Frontend | React 18 · TypeScript · Vite |
| Routing | React Router v6 |
| Server state | TanStack Query v5 (with optimistic updates) |
| Styling | Tailwind CSS (custom components — no external UI library) |
| Container | Docker · docker compose |

---

## 2. Architecture Decisions

**TypeScript on the backend (not Go):** The assignment permits any language. TypeScript was chosen for consistency across the stack and faster development velocity.

**TypeORM with explicit migrations over raw SQL:** TypeORM was chosen specifically for `migration:generate` — when an entity changes, TypeORM diffs the schema and writes the migration SQL automatically. `synchronize` is always `false`; no ORM magic touches production.

**Layered backend architecture (routes → controllers → services → DB):** Controllers own request/response and validation (Zod). Services own business logic and auth checks. This keeps each layer independently testable and readable.

**TanStack Query for server state:** Handles caching, loading/error states, and optimistic updates (task status changes) with minimal boilerplate. Auth state lives in React Context + localStorage — no Zustand/Redux needed at this scale.

**Tailwind CSS with custom components:** Avoids the setup overhead of shadcn/ui while still producing a clean, consistent UI. All components are purpose-built for this app.

**Bonus items implemented:**
- Integration tests — Jest + Supertest with real DB; run with `npm test` in `/backend`
- Stats endpoint — `GET /projects/:id/stats` returns task counts by status and assignee

**Bonus items intentionally skipped:**
- Pagination — would add `?page=&limit=` on list endpoints
- Real-time updates — would use SSE
- Drag-and-drop / dark mode

---

## 3. Running Locally

Requires: Docker and Docker Compose. Nothing else.

```bash
git clone https://github.com/kaliprasadkandula/Greening-India-Assingment.git
cd Greening-India-Assingment
cp .env.example .env
docker compose up --build
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:4000
- **Health check:** http://localhost:4000/health

On first start, migrations and seed run automatically. Subsequent starts skip the seed (idempotent).

---

## 4. Running Migrations

Migrations run automatically on container start via `npm run migrate` (TypeORM CLI against the compiled output).

To run manually in development:

```bash
cd backend
npm install
npm run migrate:dev         # apply all pending migrations
npm run migrate:revert      # revert the last migration
```

To generate a migration after changing an entity:

```bash
npm run migration:generate -- src/migrations/YourMigrationName
# Review the generated file, then apply:
npm run migrate:dev
```

---

## 5. Test Credentials

Pre-seeded on first `docker compose up`:

```
Email:    test@example.com
Password: password123
```

---

## 6. API Reference

All protected endpoints require: `Authorization: Bearer <token>`

### Users

| Method | Endpoint | Notes | Response |
|---|---|---|---|
| GET | `/users` | List all users (id, name, email) | `200 { users: [] }` |

### Auth

| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` | `201 { token, user }` |
| POST | `/auth/login` | `{ email, password }` | `200 { token, user }` |

### Projects

| Method | Endpoint | Notes | Response |
|---|---|---|---|
| GET | `/projects` | Lists owned + assigned-to projects | `200 { projects: [] }` |
| POST | `/projects` | `{ name, description? }` | `201 project` |
| GET | `/projects/:id` | Includes tasks array | `200 project` |
| PATCH | `/projects/:id` | Owner only · `{ name?, description? }` | `200 project` |
| DELETE | `/projects/:id` | Owner only · cascades tasks | `204` |
| GET | `/projects/:id/stats` | Owner only · task counts by status & assignee | `200 stats` |

### Tasks

| Method | Endpoint | Notes | Response |
|---|---|---|---|
| GET | `/projects/:id/tasks` | `?status=todo\|in_progress\|done` · `?assignee=uuid` | `200 { tasks: [] }` |
| POST | `/projects/:id/tasks` | `{ title, description?, status?, priority?, assignee_id?, due_date? }` | `201 task` |
| PATCH | `/tasks/:id` | Any field optional | `200 task` |
| DELETE | `/tasks/:id` | Project owner or task creator only | `204` |

### Error responses

```json
{ "error": "validation failed", "fields": { "email": "is required" } }  // 400
{ "error": "unauthorized" }   // 401
{ "error": "forbidden" }      // 403
{ "error": "not found" }      // 404
```

---

## 7. What I'd Do With More Time

- **Pagination** — `?page=&limit=` on `/projects` and `/projects/:id/tasks` with total count in the response.
- **Assignee resolution in task list** — Task cards show assignee names for users already loaded; embedding user name directly in the task response would remove the client-side join.
- **Better error boundaries in the frontend** — React Error Boundary wrapping page-level components so an uncaught error in one section doesn't blank the whole screen.
- **Refresh token flow** — Currently the JWT is valid for 24h with no rotation. A refresh token pattern would be safer for production.
- **Rate limiting** — Add `express-rate-limit` on the auth endpoints to prevent brute-force.
- **CI pipeline** — GitHub Actions to run `tsc --noEmit` and the test suite on every PR.
