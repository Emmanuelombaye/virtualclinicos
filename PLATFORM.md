# VirtualClinicOS — Platform Core

Maps enterprise platform qualities to this **clinic launch / delivery ops** product (not EMR/clinical).

Phase docs: [PHASE1](./PHASE1.md) · [PHASE2](./PHASE2.md) · [PHASE3](./PHASE3.md) · [PHASE4](./PHASE4.md) · [PHASE5](./PHASE5.md)

| Checklist item | Status | Notes |
|----------------|--------|-------|
| Multi-tenancy (org isolation) | **Built** | `Organization` + `organizationId` on all domain tables |
| Soft deletes | **Built** | Client / Comment / File / Task / Risk |
| Users in DB + bcrypt | **Built** | Seeded demo users; password hashed with bcrypt |
| Fine-grained permissions | **Built** | Catalog includes views/automations/webhooks/AI/… |
| System + custom roles | **Built** | Seeded ceo/ae/viewer/superadmin; roles UI |
| Invitations | **Built** | Email adapter + `/invite/[token]` + seat soft limit |
| Org settings / white-label | **Built** | Color, logo, emailFromName, supportEmail |
| Activity feed | **Built** | `ActivityEvent` + client Activity tab |
| Comments | **Built** | Threads, mentions, reactions |
| File storage | **Built** | Local `StorageProvider` |
| Notifications | **Built** | In-app + console email |
| Global search (Ctrl+K) | **Built** | Clients, tasks, risks, users, files |
| Mutation authz | **Built** | `requirePermission` on services & `/api/v1` |
| Session JWT httpOnly | **Built** | Cookie + impersonation claim |
| Audit log + CSV export | **Built** | `/audit` + `/api/v1/audit/export` |
| Versioned REST API | **Built** | Broad `/api/v1` surface Phases 2–5 |
| Health check | **Built** | db/storage/email/queue depth |
| Metrics snapshot | **Built** | Clients/tasks/risks + API usage |
| API keys + Bearer | **Built** | Hashed keys; rate limits |
| Webhooks | **Built** | HMAC + delivery outbox |
| Feature flags | **Built** | Calendar / automations / AI |
| Billing stub | **Built** | Subscription plan/seats UI |
| Optimistic locking | **Built** | version on Client/Task/Risk/Gate |
| Background jobs | **Built** | In-process provider |
| Launch templates | **Built** | 5 seeded specialties |
| Automations | **Built** | gate/task/risk triggers |
| AI assistant | **Built** | Console / OpenAI provider |
| Delay risk | **Built** | Heuristic score |
| Marketplace plugins | **Built** | Slack/HubSpot/Zapier stubs |
| Postgres path | **Next** | Schema is Postgres-compatible |
| Redis/BullMQ / OTel full | **Later** | Documented stubs |

## API surface (v1)

Auth: session cookie **or** `Authorization: Bearer <api_key>` (see resolveAuth). Invite accept + health remain public via middleware.

Key routes include clients, templates, from-template, views, custom-fields, workload, calendar, automations, api-keys, webhooks, flags, billing, audit/export, tasks/bulk, imports/exports, AI, presence, plugins, jobs/recurring-tick, metrics, health.

## Env

`DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, `STORAGE_*`, `EMAIL_DRIVER`, optional `OPENAI_API_KEY`.
