# Drovery Admin

[![CI](https://github.com/senafathoni2998/Drovery-Admin-Frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/senafathoni2998/Drovery-Admin-Frontend/actions/workflows/ci.yml)

The operator & support web console for [Drovery](../drovery-backend) — a React SPA that talks
to the backend's role-gated `/admin` API. Sibling to `drovery-backend` (the API) and
`drovery-mobile` (the customer app).

## Stack

Vite 7 · React 19 · TypeScript · MUI 7 · Redux Toolkit · react-router 7 · Vitest — matching
the conventions of the other Drovery web frontend.

## Run it

The backend must be running (defaults to `http://localhost:3000`, prefix `/api/v1`). Its CORS
defaults to `*` when `CORS_ORIGINS` is unset, so local dev works out of the box.

```bash
cp .env.example .env        # VITE_API_BASE_URL (defaults to http://localhost:3000/api/v1)
npm install
npm run dev                 # http://localhost:5174
```

Sign in with a staff account — the seeded admin is `admin@drovery.com` / `admin123`. A `USER`
account is rejected (staff only); an `AGENT` sees only the Support inbox.

```bash
npm run build               # tsc -b && vite build
npm run lint                # eslint
npm test                    # vitest
```

## How it works

- **Auth** — `POST /auth/login` → the access token is stored, then `GET /users/me` resolves the
  profile (incl. `role`). The token rides every request as a bearer; a `401` anywhere clears it
  and bounces to `/login`. The authoritative gate is always the backend `RolesGuard` — the UI
  role only decides which nav to render.
- **API** — `src/api/client.ts` is a typed `fetch` wrapper that unwraps the `{ success, data }`
  success envelope and throws a readable `ApiError` (with status) on failure.
- **State** — Redux Toolkit holds the auth session; server data is fetched per-page via the
  `useApi` hook (loading / error / refetch).

## Structure

```
src/
  api/        fetch client + token storage
  app/        Redux store + typed hooks
  features/   auth slice (login / session bootstrap)
  hooks/      useApi (data fetching)
  layout/     ProtectedRoute (guard) + AppLayout (shell)
  models/     API envelope + enum unions + admin response types
  pages/      Login, Dashboard, ComingSoon, NotFound
  router/     route table
  theme/      MUI theme
```

## Roadmap

The `/admin` surface is built one section at a time. Done / planned:

- [x] Foundation — auth, app shell, role-aware nav, **Overview dashboard**
- [ ] Deliveries oversight (list/detail, force-cancel, fail, refund, drone commands)
- [ ] Promo CRUD
- [ ] User & role management
- [ ] Support inbox (AGENT + ADMIN)

Placeholder routes render a "coming soon" page until their increment lands.
