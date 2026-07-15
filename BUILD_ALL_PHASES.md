# VirtualClinicOS — Build All Phases (Agent TODO)

**Goal:** Complete Phases 2–5 without human input.  
**Time box:** Prefer finishing **every phase at MVP quality** in ~3 hours over polishing one phase.

**Rules for the agent**
1. Do **not** edit plan files under `.cursor/plans/`.
2. Keep modular monolith; extend `web/src/lib/services/*`, Prisma, `/api/v1`, App Router UI.
3. Every write: Zod → `requirePermission` → Prisma (+ `$transaction` when multi-step) → `writeAudit` + `writeActivity` where domain-relevant.
4. Re-seed + `npx tsc --noEmit` before considering a phase done.
5. Skip EMR/FHIR/video/billing-clinical. Delivery ops only.
6. If blocked on secrets/providers, keep adapters + console/local stubs (same pattern as Phase 1 email/storage).
7. Mark each checkbox `[x]` in this file as you complete it.

**Suggested 3h split**
| Window | Focus |
|--------|--------|
| 0:00–0:50 | Phase 2 MVP |
| 0:50–1:40 | Phase 3 MVP |
| 1:40–2:20 | Phase 4 MVP |
| 2:20–2:50 | Phase 5 MVP |
| 2:50–3:00 | Docs, seed, typecheck, smoke |

---

## Phase 0 — Hygiene (5 min)

- [ ] Confirm `cd web && npx tsc --noEmit` and seed work
- [ ] Skim `PLATFORM.md` + `PHASE1.md`; append new rows as you finish phases
- [ ] Create `web/PHASE2.md` … `web/PHASE5.md` stubs and fill as you go

---

## PHASE 2 — Operations (MVP in ~50 min)

### 2.1 Launch templates
- [ ] Prisma `LaunchTemplate` + `LaunchTemplateGate` (org-scoped)
- [ ] Seed: Dental, Telehealth, Primary Care, Hospital, Specialist
- [ ] Service: list templates; create client from template (gates/tasks prefs)
- [ ] UI: “New client from template” on clients / new-client flow
- [ ] API: `GET/POST /api/v1/templates`, `POST /api/v1/clients/from-template`

### 2.2 Saved views
- [ ] Prisma `SavedView` (`userId`, `organizationId`, `name`, `entity`, `filterJson`, `isShared`)
- [ ] Service CRUD + permission `views.manage` / own views always
- [ ] UI: Clients page filter chips + “Save view” / “My views”
- [ ] Seed: Delayed Launches, High Risk, Enterprise Clients

### 2.3 Custom fields
- [ ] Prisma `CustomFieldDef` + `CustomFieldValue` (entityType Client|Task|Risk)
- [ ] Service: define fields (settings), set/get values
- [ ] UI: Client detail “Custom” section; Org settings field admin
- [ ] Permission: `custom_fields.manage`

### 2.4 Recurring tasks (slim)
- [ ] Prisma `RecurringTaskRule` (cron-ish: weekly|monthly|quarterly|yearly + template fields)
- [ ] On client create / daily stub: expand due instances into `Task` (call from a service; no Redis yet — invoke from health or a `POST /api/v1/jobs/recurring-tick` secure to session/ceo)
- [ ] UI: create rule form on tasks page (minimal)

### 2.5 Workload planner (slim)
- [ ] Extend AE model or add `AeAvailability` (vacation start/end, capacity override)
- [ ] AE Dashboard: show Available / Overloaded / Free vs capacityLoad + open tasks
- [ ] API: `GET /api/v1/workload`

### 2.6 Calendar / milestones (slim — skip full Gantt if time-crushed)
- [ ] Derive milestone list: clients with `daysToLaunch`, task dues parsed loosely, gate completes
- [ ] Page `/calendar` month/list view (read-only timeline CSS grid)
- [ ] Optional later: full Gantt — mark deferred if under 15 min left in Phase 2

### 2.7 Dashboard widgets (slim)
- [ ] Prisma `DashboardLayout` (`userId`, `widgetsJson`)
- [ ] CEO can toggle widgets: Revenue, Tasks, Risks, Launches
- [ ] Persist layout; default widgets if none

### 2.8 Automation (minimal rule engine)
- [ ] Prisma `AutomationRule` (`trigger`, `conditionsJson`, `actionsJson`, `enabled`)
- [ ] Triggers MVP: `gate.complete`, `task.created`, `risk.critical`
- [ ] Actions MVP: create task, notify user(s), write activity
- [ ] Run hooks inside existing mutation services after success
- [ ] UI: `/settings/automations` list + enable toggle + 1 create form
- [ ] Seed 1–2 rules (Gate Complete → create follow-up task + notify AE)

### Phase 2 done criteria
- [ ] Seed includes templates + sample automation
- [ ] `tsc` clean; `PLATFORM.md` Phase 2 rows → Built
- [ ] Write `PHASE2.md`

---

## PHASE 3 — Enterprise SaaS (MVP in ~50 min)

### 3.1 API keys
- [ ] Prisma `ApiKey` (hashed secret, prefix, scopesJson, lastUsedAt, revokedAt)
- [ ] Service: create/rotate/revoke; verify Bearer on `/api/v1/*` (alongside cookie)
- [ ] Scopes map to permission strings subset
- [ ] UI: `/settings/api-keys`
- [ ] Permission: `api_keys.manage` (already in catalog)

### 3.2 Webhooks
- [ ] Prisma `WebhookEndpoint` + `WebhookDelivery` (outbox)
- [ ] Events: `task.created`, `gate.status`, `risk.critical`, `client.created`
- [ ] Deliver via fetch in-process (retry count field); console log failures
- [ ] UI: `/settings/webhooks`
- [ ] Sign payload with HMAC secret

### 3.3 Rate limiting (slim)
- [ ] In-memory token bucket per `organizationId` (or API key) for `/api/v1`
- [ ] Headers: `X-RateLimit-Remaining`; 429 JSON
- [ ] Org setting `apiRateLimitPerMinute` default 120

### 3.4 API usage dashboard (slim)
- [ ] Prisma `ApiUsageDaily` or increment counters on each v1 hit
- [ ] Page `/settings/api-usage`: requests, errors, top routes (JSON also `/api/v1/metrics` extend)

### 3.5 Feature flags
- [ ] Prisma `FeatureFlag` (org or global key, enabled)
- [ ] Helper `isFeatureEnabled(orgId, key)`; gate calendar/automations/AI behind flags
- [ ] UI: `/settings/flags` (ceo)

### 3.6 White label (extend org settings)
- [ ] Fields: `emailFromName`, `supportEmail`, `customCss` (sanitized allowlist) OR stick to primaryColor + logoFileId
- [ ] Shell already uses primaryColor — wire logo display in sidebar if FileObject set
- [ ] Invite/email templates use org name/color

### 3.7 Audit export
- [ ] `GET /api/v1/audit/export?format=csv` (permission `audit.view`)
- [ ] Button on `/audit` — CSV download (Excel/PDF defer)

### 3.8 Org billing stub (not Stripe live)
- [ ] Prisma `Subscription` (plan: free|pro|enterprise, status, seats)
- [ ] UI `/settings/billing` read-only plan + usage seats/storage/api
- [ ] Enforce soft seat limit on invitations if plan=free

### 3.9 Impersonation
- [ ] Permission `users.impersonate` (ceo/superadmin only)
- [ ] Cookie or session claim `impersonatorId`; banner “Viewing as X — Exit”
- [ ] All audits while impersonating record actor + impersonator
- [ ] UI: Team page “Login as”

### 3.10 SSO / MFA (stubs acceptable in 3h)
- [ ] MFA: `User.mfaEnabled`, TOTP secret encrypted, login challenge page (use `otpauth` or minimal TOTP lib); recovery codes hashed
- [ ] SSO: document + stub routes `/api/auth/sso/google/start` returning 501 with clear message OR NextAuth/Auth.js Google if dependency install is fast
- [ ] Prefer working MFA + SSO “coming soon” panel over broken OAuth

### Phase 3 done criteria
- [ ] Cookie **or** API key auth works on one protected v1 route
- [ ] One webhook fires on task.create (delivery row written)
- [ ] `tsc` clean; `PHASE3.md` + PLATFORM update

---

## PHASE 4 — Production Ready (MVP in ~40 min)

### 4.1 Soft deletes everywhere critical
- [ ] Ensure Task/Risk soft delete optional OR harden Client/Comment/File (already)
- [ ] Add `deletedById` where missing on soft-deleted entities

### 4.2 Optimistic locking
- [ ] Add `version Int @default(1)` on Client, Task, Risk, ClientGate
- [ ] Updates: `WHERE id AND version`; increment; conflict → 409
- [ ] UI: toast “Someone else edited — refresh”

### 4.3 Background jobs adapter (no Redis required for MVP)
- [ ] `JobProvider` interface + `InProcessJobProvider` (setTimeout/queue array)
- [ ] Jobs: `email.send`, `webhook.deliver`, `report.export`, `recurring.tick`
- [ ] Optional: if `REDIS_URL` set, document BullMQ as Next; don’t block on Redis

### 4.4 Observability slim
- [ ] Request id already — add structured `logger` helper (json lines)
- [ ] `/api/v1/health` expand: db, storage writable, email driver, queue depth
- [ ] Counters: error rate in metrics
- [ ] Skip full OpenTelemetry SDK if it burns >15 min; add `OTEL.md` stub + dependency comment

### 4.5 Backups (dev-grade)
- [ ] Script `scripts/backup-db.ts` copy sqlite file to `storage/backups/`
- [ ] `npm run db:backup`; document restore
- [ ] Optional cron via job tick

### 4.6 Bulk operations
- [ ] `POST /api/v1/tasks/bulk` `{ ids, action: assign|status|delete }`
- [ ] Tasks UI multi-select (checkbox) + bulk status

### 4.7 Import / export wizard (slim)
- [ ] CSV import clients: preview → commit (`POST /api/v1/imports/clients`)
- [ ] Export clients CSV button
- [ ] Validation errors returned as row list

### 4.8 Data version history (slim)
- [ ] Prisma `EntityRevision` (entityType, entityId, version, snapshotJson, actorId)
- [ ] Write revision on Client/Task update (last N=20)
- [ ] UI: “History” drawer on client detail (restore = create new update from snapshot)

### 4.9 i18n + a11y (minimal)
- [ ] `messages/en.json` + tiny `t()` helper for nav labels only
- [ ] Focus rings / aria-labels on search, notifications, invite form
- [ ] Skip full Swahili pack if time-crushed — leave `messages/sw.json` empty stub

### Phase 4 done criteria
- [ ] Optimistic lock conflict path tested in service unit or manual note in PHASE4.md
- [ ] Health returns subsystem statuses
- [ ] `tsc` clean; PLATFORM update

---

## PHASE 5 — Wow Features (MVP in ~30 min)

### 5.1 AI assistant (provider-agnostic)
- [ ] `AiProvider` interface; `ConsoleAiProvider` + optional `OpenAIProvider` if `OPENAI_API_KEY`
- [ ] Endpoints: `POST /api/v1/ai/summarize-launch` `{ clientId }`, `suggest-next-steps`, `draft-update`
- [ ] UI: Client detail “Ask AI” panel showing summary + suggestions
- [ ] Always audit AI calls; never send cross-org data

### 5.2 Predictive delay score (heuristic OK)
- [ ] Pure function: score from overdue tasks, open critical risks, AE capacity, waitingOn days
- [ ] Show on client card + command center: “82% delay risk” + reasons list
- [ ] API field on client GET `delayRisk: { score, reasons[] }`

### 5.3 Executive command center (multi-signal)
- [ ] Upgrade `/command-center` KPIs: completion %, SLA breaches (waitingOn>N), utilization, revenue (mrr sum)
- [ ] If single-org only, still show “org health score”
- [ ] Superadmin optional: list orgs count (query all orgs if role superadmin)

### 5.4 Real-time (slim — no full CRDT)
- [ ] Presence: `POST /api/v1/presence` heartbeat; in-memory map; show “Also viewing” on client page via 5s poll
- [ ] Skip live cursors/Yjs unless trivial

### 5.5 Plugin marketplace (stub)
- [ ] Prisma `Plugin` + `OrgPluginInstall`
- [ ] Catalog page `/marketplace` with 3 fake integrations (Slack, HubSpot, Zapier) Install → flag/webhook bootstrap
- [ ] Document extension points in `PHASE5.md`

### Phase 5 done criteria
- [ ] Delay risk visible without API key
- [ ] AI panel works with console provider
- [ ] `tsc` clean; PLATFORM + PHASE5.md

---

## Final gate (always)

- [ ] `npx prisma db push` (or migrate) + `npx prisma db seed`
- [ ] `npx tsc --noEmit`
- [ ] Smoke: login ceo → command center → client activity/comment → create task → invite page loads → `/api/v1/health`
- [ ] Update root `web/README.md` with phase links and new demo flows
- [ ] Do not force-push; do not commit unless user asked

---

## Continue wave (auth + polish)

- [x] Bearer/session `resolveAuthWithRateLimit` on all `/api/v1` routes
- [x] Invite revoke button
- [x] Org logo upload UI
- [x] Billing checkout stub + plan buttons
- [x] Microsoft SSO 501 stub + Redis/Stripe env docs

## Permission catalog additions to register

Add to `permissions-catalog.ts` as you touch features:

`views.manage`, `custom_fields.manage`, `automations.manage`, `users.impersonate`, `billing.view`, `flags.manage`, `webhooks.manage`, `ai.use`, `imports.manage`
