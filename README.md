# Drovery Admin

**Role-gated operator console for the Drovery drone delivery platform — manage deliveries, promos, users, and support tickets.**

Drovery Admin is the staff-facing web console for Drovery, an autonomous drone-delivery platform. Operators and support agents sign in with staff credentials to oversee live deliveries, intervene on stuck or failed orders, run promotions, manage user roles, and answer customer support tickets in real time. It is a single-page app built on React 19, Vite, MUI 7, and Redux Toolkit, talking to the Drovery backend over a fully typed HTTP + WebSocket client.

> **Part of the Drovery system.** Drovery is a portfolio/demo of an autonomous drone-delivery platform (personal project by Sena Fathoni), split across three repos:
> - [Drovery-Backend](https://github.com/senafathoni2998/Drovery-Backend) — NestJS 11 + Prisma 7 + Postgres + Redis/BullMQ API; the brain, runs the drone simulation.
> - [Drovery-Mobile](https://github.com/senafathoni2998/Drovery-Mobile) — Expo / React Native customer app.
> - **Drovery-Admin-Frontend** — this repo; the Vite + React + MUI operator/support console.
>
> Live demo: API https://droverybackend.senafathoni.dev • Admin https://droverydashboard.senafathoni.dev

---

## Features

- **JWT auth with refresh-token rotation** — 401 responses trigger an automatic silent refresh and request retry; bearer tokens are attached transparently by the API client.
- **Dashboard** — KPI stats (users, revenue, open tickets, recurring schedules) plus a delivery status distribution breakdown.
- **Delivery oversight** — paginated, status-filterable delivery list, and a detail view surfacing order, payment, live tracking, proof-of-delivery, and rating data.
- **Delivery admin actions** — force cancel, mark failed (with reason), refund (full or partial), and issue drone commands (`RETURN_TO_BASE`, `ABORT`). Each action triggers an immediate backend state transition.
- **Promo CRUD** — create and edit discount codes with time windows, minimum order, max cap, redemption limits, and an active/inactive toggle.
- **User management** — list and filter users by role, and change a role (`USER` / `AGENT` / `ADMIN`) with immediate server-side re-resolution.
- **Support inbox** — paginated, status-filterable ticket list; detail view with a live WebSocket message stream, reply input, and status management. Messages are deduped by ID to avoid duplicates.
- **Role-based navigation** — `ADMIN` sees every section; `AGENT` sees only the support inbox; `USER` accounts are rejected at login.
- **Typed API client** — standardized error handling and bearer-token management throughout.
- **Unit + render tests** (Vitest + React Testing Library) across pages, components, and feature logic.

## Tech stack

| Layer | Technology |
| --- | --- |
| UI framework | React 19.2.0 |
| Build tool | Vite 7.2.4 |
| Language | TypeScript 5.9.3 |
| Component library | Material-UI 7.3.6 |
| State management | Redux Toolkit 2.11.2 |
| Routing | react-router 7.11.0 |
| Testing | Vitest 4.0.18 + React Testing Library |
| Runtime | Node 22 |
| Production serving | nginx 1.27-alpine |

## Quick start

### Prerequisites

- Node 22 or later
- npm installed
- Drovery backend API running at `http://localhost:3000/api/v1` (or set `VITE_API_BASE_URL` to point elsewhere)

### Install & run

```bash
# 1. Clone the repository
git clone https://github.com/senafathoni2998/Drovery-Admin-Frontend.git
cd Drovery-Admin-Frontend

# 2. Install dependencies
npm install

# 3. (Optional) configure the API base URL
cp .env.example .env
# edit .env if your backend is on a different host

# 4. Start the dev server
npm run dev
```

Then open **http://localhost:5174** and log in with staff credentials. The default seeded admin is:

```
email:    admin@drovery.com
password: admin123
```

## Configuration

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL, including the `/api/v1` prefix. Defaults to `http://localhost:3000/api/v1` in dev. In production behind the Caddy edge proxy, use the relative path `/api/v1` so the image works on any domain without a rebuild. |

## Project structure

```
src/
├── api/         # Typed HTTP client, token storage, WebSocket support connection
├── app/         # Redux store + typed hooks (useAppDispatch, useAppSelector)
├── features/    # Redux slices (auth) + business logic (delivery actions,
│                #   promo form validation, support WebSocket)
├── hooks/       # useApi (GET fetching), useMutation (POST/PATCH mutations)
├── layout/      # ProtectedRoute guard, AppLayout (sidebar + top bar + outlet)
├── models/      # Enums (roles, statuses, reasons) + admin API DTO interfaces
├── pages/       # Dashboard, Login, Deliveries (list + detail), Promos,
│                #   Users, Support (list + detail), NotFound
├── components/  # StatusChip, ConfirmDialog, PromoFormDialog, PageLoader
├── router/      # React Router 7 route table, code-split via React.lazy
└── theme/       # MUI theme configuration
```

## Testing

16 test files run under Vitest + React Testing Library, covering:

- **Pages** — Dashboard, Login, Deliveries list/detail, Promos list, Support list/detail, Users list.
- **Components** — StatusChip, ConfirmDialog, PromoFormDialog.
- **Features** — auth, delivery actions, promo form validation, support socket.
- **Utilities** — shared helpers.

The test timeout is set to 20s to accommodate MUI dialog/select async rendering.

```bash
npm test
```

## Deployment

The app ships as a multi-stage Docker image (Node 22 build stage → nginx 1.27-alpine serving stage):

- **Image:** `senaahmad2998/drovery-admin`
- **Default API base:** the Dockerfile builds with the relative path `/api/v1`, so the image runs behind the Caddy edge proxy on any domain without a rebuild. Override with `--build-arg VITE_API_BASE_URL=...` for a cross-origin backend.
- **nginx.conf:** 1-year cache on `/assets/`, plus SPA history fallback so client-side routes resolve.

```bash
docker build -t senaahmad2998/drovery-admin .
# cross-origin backend:
docker build --build-arg VITE_API_BASE_URL=https://api.example.com/api/v1 -t senaahmad2998/drovery-admin .
```

**CI/CD (GitHub Actions):**

- **CI** — lint + build + test on every push to `main` and on PRs.
- **Publish** — Docker build + push to Docker Hub on `main`, on version tags, or via manual trigger. Requires the `DOCKERHUB_TOKEN` secret.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server (http://localhost:5174). |
| `npm run build` | TypeScript check + Vite production bundle. |
| `npm run lint` | ESLint code-quality check. |
| `npm test` | Run Vitest unit and render tests. |
| `npm run preview` | Preview the built bundle locally. |

## Notes & caveats

- **Auth is UI-level only.** The backend `RolesGuard` is the authoritative access control — the frontend role gating is for UX, not security.
- **Staff only.** `USER` role accounts are rejected at login; only `AGENT` or `ADMIN` may sign in.
- **Role scoping.** Only `ADMIN` can access Dashboard, Deliveries, Promos, and Users; `AGENT` can only view the Support inbox.
- **Token storage** uses browser `localStorage` (no HttpOnly cookies yet).
- **Promo immutability.** A promo's `code` and `discountType` cannot be edited after creation, and `startsAt` cannot be changed.
- **Live support.** The support inbox uses WebSocket for live message updates, with ID-based dedupe to prevent duplicate messages.
- **Immediate effects.** Delivery admin actions (cancel, fail, refund, issue command) trigger immediate backend state transitions.

> **On scaling:** the broader Drovery platform is engineered with additive, env-gated scaling seams (see `SCALING-1M.md` in the backend repo) and has been demonstrated clean under proportional load. It is not yet validated at 1M concurrent users.