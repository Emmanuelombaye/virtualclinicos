# Phase 3 — Enterprise SaaS MVP

## Shipped
- API keys (hashed) + Bearer auth via `resolveAuth` on clients list (middleware allows Bearer)
- Webhooks + HMAC delivery via in-process jobs; delivery rows written
- In-memory rate limit + `apiRateLimitPerMinute` on org
- `ApiUsageDaily` counters on rate-limited auth path
- Feature flags UI + calendar/automations/AI gated
- Org white-label fields (`emailFromName`, `supportEmail`, plan)
- Audit CSV export
- Subscription billing stub + free seat soft limit
- Impersonation (session claim + banner + Team “Login as”)
- MFA stub (`/settings/security`, code `000000`) + SSO 501 stub

## Notes
Cookie **or** API key works on `GET /api/v1/clients`.
