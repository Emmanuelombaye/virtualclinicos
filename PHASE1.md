# VirtualClinicOS Phase 1 — Enterprise Foundation

## Adapters

| Concern | Interface | Default |
|---------|-----------|---------|
| Files | `StorageProvider` in `src/lib/infra/storage.ts` | Local disk `STORAGE_ROOT` (default `./storage`) |
| Email | `EmailProvider` in `src/lib/infra/email.ts` | `ConsoleEmailProvider` (`EMAIL_DRIVER=console`) |

Invite links use `APP_URL` (default `http://localhost:3000`).

## Permissions

Catalog: `src/lib/auth/permissions-catalog.ts`. Assignments live on `Role` / `RolePermission`. Session loads permissions onto `AuthUser.permissions`. Services call `requirePermission(user, "…")`.

System roles seeded: `superadmin`, `ceo`, `ae`, `viewer`.

## Surfaces

- `/settings/organization` — org profile / timezone / colors / notification prefs
- `/settings/team` — members + invitations
- `/settings/roles` — permission matrix
- `/notifications` — in-app inbox
- `/invite/[token]` — accept invite (public)
- Client detail: Activity, Comments, Files tabs
- Global search: Ctrl/Cmd+K — clients, tasks, risks, users, files

## API

- `GET/PATCH /api/v1/organization`
- `GET/POST /api/v1/invitations`
- `POST /api/v1/invitations/accept`
- `GET/POST /api/v1/comments`
- `GET/POST /api/v1/files`, `GET /api/v1/files/:id/download`
- `GET/PATCH /api/v1/notifications`
