# Phase 4 — Production Ready MVP

## Shipped
- Soft delete fields on Task/Risk; Client `deletedById`
- Optimistic locking `version` on Client/Task/Risk/ClientGate + `updateWithVersion` (409 on conflict)
- `InProcessJobProvider` for email/webhook/recurring jobs
- Structured logger + expanded `/api/v1/health` (db/storage/email/queue)
- `npm run db:backup` → `storage/backups/`
- Bulk task ops API
- Client CSV import/export
- Entity revisions (last 20)
- i18n stub `messages/en.json` + `t()`; empty `sw.json`

## Optimistic lock
Services pass expected `version`; mismatch throws `VersionConflictError` → HTTP 409.
