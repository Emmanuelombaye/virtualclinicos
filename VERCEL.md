# Deploy VirtualClinicOS on Vercel (MySQL)

## Why login failed before

Vercel cannot use local SQLite. You need a remote MySQL (or Postgres) `DATABASE_URL`.

This project is configured for **MySQL** via Prisma (`provider = "mysql"`).

---

## 1. Create free MySQL on Aiven

1. [Aiven console](https://console.aiven.io) → **Create service** → **MySQL** → plan **Free**
2. Open the service → **Overview** → connection details  
   - Use the **MySQL** tab (classic), **not MySQLx** (X Protocol — Prisma cannot use that)  
3. Build:

```text
mysql://avnadmin:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT/defaultdb?sslaccept=strict
```

Use `sslaccept=strict` (Prisma). SSL mode in the UI shows `REQUIRED` — that maps to this.

---

## 2. Apply schema + seed (from your laptop)

In `web/.env` set `DATABASE_URL` to the Aiven URI, then:

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

---

## 3. Vercel environment variables

Project → **Settings** → **Environment Variables**:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Aiven MySQL URI (with `?sslaccept=strict`) |
| `AUTH_SECRET` | Long random string |
| `APP_URL` | `https://virtualclinicos.vercel.app` |
| `EMAIL_DRIVER` | `console` |

**Redeploy** after saving.

---

## 4. Confirm

`https://virtualclinicos.vercel.app/api/v1/health` → `"db":"up"`

Login: `alex@virtualclinicos.com` / `demo`

---

## Notes

- Aiven **Free** MySQL can sleep after inactivity — wake it in the console if health goes down.
- Do **not** commit `.env` or passwords to GitHub.
- If you pasted a password in chat/screenshots, **reset it** in Aiven after setup.
- File uploads still use local disk stubs on Vercel (optional: Vercel Blob later).
