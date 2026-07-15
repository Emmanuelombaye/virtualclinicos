# VirtualClinicOS

**Clinic launch & delivery operations** — not an EMR. Track clients through 11 phases and 24 launch gates, assign AEs, manage tasks/risks, and run portfolio Command Center health from one Next.js app.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite%20%7C%20Postgres-2D3748)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

---

## What's included

| Area | Capabilities |
|------|----------------|
| **Delivery ops** | Clients, phases, 24 gates, tasks (kanban), risks, deliverables, calendar, Gantt lite |
| **Dashboards** | CEO Command Center, AE portfolio, delay-risk scoring, workload |
| **Collaboration** | Comments, mentions, files, activity, in-app notifications |
| **Account** | Login, forgot/reset password, profile & alert prefs, security / MFA stub |
| **Workspace** | Team invites, RBAC roles, custom fields, automations, org white-label |
| **Platform** | REST `/api/v1`, API keys, webhooks, feature flags, audit CSV, Ctrl+K search |
| **Ops jobs** | Recurring tasks + due-task digests (in-process; Redis-ready stub) |

Docs in-repo: [PLATFORM.md](./PLATFORM.md) · [PHASE1](./PHASE1.md)–[PHASE5](./PHASE5.md) · [BUILD_ALL_PHASES.md](./BUILD_ALL_PHASES.md)

---

## Quick start

```bash
git clone https://github.com/Emmanuelombaye/virtualclinicos.git
cd virtualclinicos
npm install
cp .env.example .env
npx prisma db push
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → sign in.

### Demo accounts (password: `demo`)

| Email | Role |
|-------|------|
| `alex@virtualclinicos.com` | CEO — full portfolio |
| `maya@virtualclinicos.com` | Account Executive |
| `devon@virtualclinicos.com` | Account Executive |
| `priya@virtualclinicos.com` | Account Executive |
| `viewer@virtualclinicos.com` | Viewer — read-only |

---

## Environment

Copy `.env.example` → `.env`.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Local default: `file:./dev.db` (SQLite under `prisma/`) |
| `AUTH_SECRET` | JWT/session signing secret (**required** in production) |
| `APP_URL` | Public app URL (password-reset links), e.g. `http://localhost:3000` |
| `EMAIL_DRIVER` | `console` (default) — prints email to server logs |
| `OPENAI_API_KEY` | Optional — live AI summarize; otherwise console stub |
| `REDIS_URL` | Optional — noted for future BullMQ; jobs run in-process today |
| `STORAGE_ROOT` | Optional — local upload directory |

---

## Project layout

```
src/
  app/                 # App Router pages + /api/v1
  components/          # UI (shell, views, auth, settings)
  lib/
    auth/              # Session, RBAC, actions
    services/          # Domain mutations (clients, tasks, …)
    infra/             # Email, storage, jobs, rate limit
prisma/
  schema.prisma        # Data model
  seed.ts              # Demo org, users, clients, gates
```

Conventions: Zod validation → `requirePermission` → Prisma → audit/activity where relevant.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Run production server |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio |
| `npm run db:backup` | Copy SQLite to `storage/backups/` |

---

## Vercel / production notes

See **[VERCEL.md](./VERCEL.md)** for the exact fix when login shows a server error (`db: down`).

The codebase is **Next.js App Router** and builds cleanly for Vercel (`Root Directory` = repo root if this package is the repo root).

**Do not use SQLite on Vercel** — use managed **Postgres** (Neon, Supabase, Vercel Postgres):

1. Set Prisma `datasource` provider to `postgresql`
2. Set `DATABASE_URL` (and usually `DIRECT_URL` for migrations)
3. Swap local file storage for **Vercel Blob / S3**
4. Set strong `AUTH_SECRET` and real `APP_URL`
5. Wire a real email provider (Resend/SendGrid) when leaving console driver

Local SQLite + console email remain ideal for demos.

---

## Demo walkthrough

1. Sign in as **Alex** → Command Center (KPIs, delay risk, welcome checklist if applicable)
2. **Clients** → filters / saved views / **Export CSV** → open a client (gates, tasks, Ask AI)
3. Avatar menu → **Profile** (timezone + notification prefs) or **Security** (change password)
4. Forgot password on login → reset link appears in the **server console** (dev email)
5. **Settings → Team** → invites; **Automations** → run recurring + digests
6. **API Keys** → Bearer token on `GET /api/v1/clients`
7. Press **?** for help / shortcuts; **⌘/Ctrl+K** for global search

---

## Stack

**TypeScript · Next.js 16 · React 19 · Prisma · Tailwind · Zod · bcrypt · Jose (JWT)**

License: private / as published by the repository owner.
