# Deploy VirtualClinicOS on Vercel

## Why `/login` showed a server error

Health check on the live site returns:

```json
{ "db": "down", "storage": "down" }
```

Vercel’s filesystem is **ephemeral**. Local SQLite (`file:./dev.db`) and local `storage/` uploads **do not work** there. Clicking **Sign in** hit Prisma → crash → “This page couldn’t load”.

Login can render; the **database is what’s broken**.

---

## Fix (required): Postgres

### 1. Create a free Neon database
1. Go to [https://neon.tech](https://neon.tech) → create project  
2. Copy the connection string (`postgresql://...`)

### 2. Point Prisma at Postgres (in this repo)

In `prisma/schema.prisma` change:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

(Local SQLite will stop working until you either use the same Neon URL locally or run Postgres locally.)

Delete the old SQLite-only migration folder if you hit migrate conflicts, then:

```bash
npx prisma db push
npx prisma db seed
```

(Run those against the Neon `DATABASE_URL`.)

### 3. Vercel → Project → Settings → Environment Variables

| Name | Value |
|------|--------|
| `DATABASE_URL` | Neon `postgresql://...` connection string |
| `AUTH_SECRET` | Long random string (e.g. `openssl rand -base64 32`) |
| `APP_URL` | `https://virtualclinicos.vercel.app` |
| `EMAIL_DRIVER` | `console` (emails go to Vercel logs) |

Redeploy after saving env vars.

### 4. Confirm

Open: `https://virtualclinicos.vercel.app/api/v1/health`

Expect: `"db":"up"`. Then sign in with `alex@virtualclinicos.com` / `demo`.

---

## Optional later

- **Files**: replace local storage with Vercel Blob / S3 (`STORAGE_DRIVER`)  
- **Email**: Resend/SendGrid instead of console  
- **Jobs**: Redis + BullMQ instead of in-process

---

## Quick checklist

- [ ] Neon Postgres created  
- [ ] Prisma `provider = "postgresql"`  
- [ ] `db push` + `db seed` on Neon  
- [ ] Vercel env: `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`  
- [ ] Redeploy  
- [ ] `/api/v1/health` shows `db: up`
