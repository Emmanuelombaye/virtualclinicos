/**
 * Creates a short-lived CEO API key against the current DATABASE_URL,
 * then curls live Vercel endpoints and writes:
 * - reports/api-smoke.json
 * - postman/VirtualClinicOS.postman_collection.json
 *
 * Usage: node --env-file=.env scripts/smoke-api.mjs
 * Or:    node scripts/smoke-api.mjs  (loads .env manually)
 */
import { createHash, randomBytes } from "crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.SMOKE_BASE_URL ?? "https://virtualclinicos.vercel.app";

function loadEnv() {
  if (process.env.DATABASE_URL) return;
  try {
    const raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const i = line.indexOf("=");
      const k = line.slice(0, i).trim();
      let v = line.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    /* no .env */
  }
}

loadEnv();

const prisma = new PrismaClient();

function hashApiKey(raw) {
  return createHash("sha256").update(raw).digest("hex");
}

function generateApiKeyRaw() {
  const prefix = `vco_${randomBytes(4).toString("hex")}`;
  const secret = randomBytes(24).toString("base64url");
  const raw = `${prefix}.${secret}`;
  return { raw, prefix, tokenHash: hashApiKey(raw) };
}

async function ensureApiKey() {
  const ceo = await prisma.user.findFirst({
    where: { email: "alex@virtualclinicos.com" },
    include: { role: true },
  });
  if (!ceo) throw new Error("CEO user not found — seed Aiven first");

  await prisma.apiKey.deleteMany({
    where: {
      organizationId: ceo.organizationId,
      name: "smoke-test",
    },
  });

  const { raw, prefix, tokenHash } = generateApiKeyRaw();
  await prisma.apiKey.create({
    data: {
      organizationId: ceo.organizationId,
      name: "smoke-test",
      tokenHash,
      prefix,
      scopesJson: "[]",
      createdById: ceo.id,
    },
  });
  return raw;
}

async function firstClientId(token) {
  const res = await fetch(`${BASE}/api/v1/clients`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const j = await res.json().catch(() => ({}));
  const list = j.data ?? j.clients ?? j;
  if (Array.isArray(list) && list[0]?.id) return list[0].id;
  if (Array.isArray(list?.items) && list.items[0]?.id) return list.items[0].id;
  return null;
}

async function call(method, path, token, body) {
  const started = Date.now();
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let status = 0;
  let ok = false;
  let snippet = "";
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      redirect: "manual",
    });
    status = res.status;
    ok = res.status >= 200 && res.status < 400;
    const text = await res.text();
    snippet = text.slice(0, 180).replace(/\s+/g, " ");
  } catch (e) {
    snippet = String(e?.message ?? e);
    ok = false;
  }
  return {
    method,
    path,
    status,
    ok,
    ms: Date.now() - started,
    snippet,
  };
}

async function main() {
  console.log(`Base: ${BASE}`);
  const token = await ensureApiKey();
  console.log("API key ready (smoke-test)");

  const clientId = await firstClientId(token);
  console.log(`Sample clientId: ${clientId ?? "(none)"}`);

  const gets = [
    ["GET", "/api/v1/health", false],
    ["GET", "/login", false],
    ["GET", "/forgot-password", false],
    ["GET", "/api/auth/sso/google/start", false],
    ["GET", "/api/auth/sso/microsoft/start", false],
    ["GET", "/api/v1/me", true],
    ["GET", "/api/v1/organization", true],
    ["GET", "/api/v1/clients", true],
    ["GET", "/api/v1/tasks", true],
    ["GET", "/api/v1/templates", true],
    ["GET", "/api/v1/notifications", true],
    ["GET", "/api/v1/views", true],
    ["GET", "/api/v1/custom-fields", true],
    ["GET", "/api/v1/automations", true],
    ["GET", "/api/v1/api-keys", true],
    ["GET", "/api/v1/webhooks", true],
    ["GET", "/api/v1/flags", true],
    ["GET", "/api/v1/billing", true],
    ["GET", "/api/v1/workload", true],
    ["GET", "/api/v1/calendar", true],
    ["GET", "/api/v1/metrics", true],
    ["GET", "/api/v1/plugins", true],
    ["GET", "/api/v1/invitations", true],
    ["GET", "/api/v1/dashboard-layout", true],
    ["GET", "/api/v1/files", true],
    ["GET", "/api/v1/exports/clients", true],
    ["GET", "/api/v1/audit/export", true],
    ["GET", "/api/search?q=clinic", true],
    ["GET", "/api/v1/presence?clientId=1", true],
    ["GET", "/api/v1/comments?entityType=Client&entityId=1", true],
  ];

  if (clientId) {
    gets.push(["GET", `/api/v1/clients/${clientId}`, true]);
  }

  const posts = [
    ["POST", "/api/v1/presence", true, { clientId: clientId ?? 1 }],
    ["PATCH", "/api/v1/notifications", true, {}],
    ["POST", "/api/v1/jobs/recurring-tick", true, {}],
    [
      "POST",
      "/api/v1/billing/checkout",
      true,
      { plan: "pro" },
    ],
    [
      "POST",
      "/api/v1/settings/mfa",
      true,
      { enabled: false, code: "000000" },
    ],
  ];

  if (clientId) {
    posts.push([
      "POST",
      "/api/v1/ai/summarize-launch",
      true,
      { clientId },
    ]);
  }

  const results = [];
  for (const [method, path, auth, body] of [...gets, ...posts]) {
    const r = await call(method, path, auth ? token : null, body);
    results.push(r);
    const mark = r.ok ? "OK " : "FAIL";
    console.log(`${mark} ${r.status} ${r.ms}ms ${method} ${path}`);
  }

  mkdirSync("reports", { recursive: true });
  writeFileSync(
    "reports/api-smoke.json",
    JSON.stringify(
      {
        base: BASE,
        at: new Date().toISOString(),
        passed: results.filter((r) => r.ok).length,
        failed: results.filter((r) => !r.ok).length,
        results,
      },
      null,
      2,
    ),
  );

  // Postman collection (Bearer auth)
  const items = [...gets, ...posts].map(([method, path, , body]) => ({
    name: `${method} ${path}`,
    request: {
      method,
      header: [{ key: "Authorization", value: "Bearer {{apiKey}}" }],
      url: `{{baseUrl}}${path}`,
      ...(body !== undefined
        ? {
            body: {
              mode: "raw",
              raw: JSON.stringify(body, null, 2),
              options: { raw: { language: "json" } },
            },
          }
        : {}),
    },
  }));

  mkdirSync("postman", { recursive: true });
  const collection = {
    info: {
      name: "VirtualClinicOS API",
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      description:
        "Live smoke collection. Set collection vars baseUrl + apiKey.",
    },
    variable: [
      { key: "baseUrl", value: BASE },
      { key: "apiKey", value: "" },
    ],
    item: items,
  };
  writeFileSync(
    "postman/VirtualClinicOS.postman_collection.json",
    JSON.stringify(collection, null, 2),
  );

  console.log(
    `\nSummary: ${results.filter((r) => r.ok).length}/${results.length} passed`,
  );
  console.log("Wrote reports/api-smoke.json");
  console.log("Wrote postman/VirtualClinicOS.postman_collection.json");
  console.log(
    "\nPostman: Import postman/VirtualClinicOS.postman_collection.json",
  );
  console.log(
    "Set collection variable apiKey to a key from Settings → API Keys (or the smoke-test key name in DB).",
  );

  // Do not print raw token in logs by default — write to local ignored file
  if (!existsSync(".gitignore") || true) {
    writeFileSync(".smoke-api-key", `${token}\n`);
    console.log("Raw smoke key saved to .smoke-api-key (local only)");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
