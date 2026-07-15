/**
 * Curls public + unauthenticated probes against live Vercel.
 * Also writes a Postman collection for full authenticated runs.
 *
 * Usage: node scripts/smoke-public.mjs
 */
import { writeFileSync, mkdirSync } from "fs";

const BASE = process.env.SMOKE_BASE_URL ?? "https://virtualclinicos.vercel.app";

async function call(method, path, body) {
  const started = Date.now();
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      redirect: "manual",
    });
    const text = await res.text();
    return {
      method,
      path,
      status: res.status,
      ok: res.status >= 200 && res.status < 400,
      ms: Date.now() - started,
      snippet: text.slice(0, 160).replace(/\s+/g, " "),
    };
  } catch (e) {
    return {
      method,
      path,
      status: 0,
      ok: false,
      ms: Date.now() - started,
      snippet: String(e?.message ?? e),
    };
  }
}

const endpoints = [
  // Public pages / stubs
  ["GET", "/api/v1/health"],
  ["GET", "/login"],
  ["GET", "/forgot-password"],
  ["GET", "/api/auth/sso/google/start"],
  ["GET", "/api/auth/sso/microsoft/start"],
  // Auth-required (expect 401 without token)
  ["GET", "/api/v1/me"],
  ["GET", "/api/v1/organization"],
  ["GET", "/api/v1/clients"],
  ["GET", "/api/v1/tasks"],
  ["GET", "/api/v1/templates"],
  ["GET", "/api/v1/notifications"],
  ["GET", "/api/v1/views"],
  ["GET", "/api/v1/custom-fields"],
  ["GET", "/api/v1/automations"],
  ["GET", "/api/v1/api-keys"],
  ["GET", "/api/v1/webhooks"],
  ["GET", "/api/v1/flags"],
  ["GET", "/api/v1/billing"],
  ["GET", "/api/v1/workload"],
  ["GET", "/api/v1/calendar"],
  ["GET", "/api/v1/metrics"],
  ["GET", "/api/v1/plugins"],
  ["GET", "/api/v1/invitations"],
  ["GET", "/api/v1/dashboard-layout"],
  ["GET", "/api/v1/files"],
  ["GET", "/api/v1/exports/clients"],
  ["GET", "/api/v1/audit/export"],
  ["GET", "/api/search?q=clinic"],
  ["GET", "/api/v1/presence?clientId=1"],
  ["GET", "/api/v1/comments?entityType=Client&entityId=1"],
  ["GET", "/api/v1/clients/1"],
  ["POST", "/api/v1/presence", { clientId: 1 }],
  ["PATCH", "/api/v1/notifications", {}],
  ["POST", "/api/v1/jobs/recurring-tick", {}],
  ["POST", "/api/v1/billing/checkout", { plan: "pro" }],
  ["POST", "/api/v1/settings/mfa", { enabled: false, code: "000000" }],
  ["POST", "/api/v1/ai/summarize-launch", { clientId: 1 }],
  ["POST", "/api/v1/invitations/accept", { token: "invalid", password: "demopass1" }],
];

const results = [];
for (const [method, path, body] of endpoints) {
  const r = await call(method, path, body);
  results.push(r);
  const mark = r.ok ? "OK  " : "----";
  console.log(`${mark} ${String(r.status).padStart(3)} ${String(r.ms).padStart(5)}ms ${method.padEnd(6)} ${path}`);
}

mkdirSync("reports", { recursive: true });
writeFileSync(
  "reports/api-smoke-public.json",
  JSON.stringify(
    {
      base: BASE,
      at: new Date().toISOString(),
      note: "No auth token — protected routes should return 401",
      passed: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    },
    null,
    2,
  ),
);

const authGets = [
  "/api/v1/me",
  "/api/v1/organization",
  "/api/v1/clients",
  "/api/v1/tasks",
  "/api/v1/templates",
  "/api/v1/notifications",
  "/api/v1/views",
  "/api/v1/custom-fields",
  "/api/v1/automations",
  "/api/v1/api-keys",
  "/api/v1/webhooks",
  "/api/v1/flags",
  "/api/v1/billing",
  "/api/v1/workload",
  "/api/v1/calendar",
  "/api/v1/metrics",
  "/api/v1/plugins",
  "/api/v1/invitations",
  "/api/v1/dashboard-layout",
  "/api/v1/files",
  "/api/v1/exports/clients",
  "/api/v1/audit/export",
  "/api/search?q=clinic",
];

mkdirSync("postman", { recursive: true });
writeFileSync(
  "postman/VirtualClinicOS.postman_collection.json",
  JSON.stringify(
    {
      info: {
        name: "VirtualClinicOS API",
        schema:
          "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        description:
          "Import into Postman. Set collection vars: baseUrl, apiKey (from Settings → API Keys).",
      },
      variable: [
        { key: "baseUrl", value: BASE },
        { key: "apiKey", value: "" },
        { key: "clientId", value: "1" },
      ],
      auth: {
        type: "bearer",
        bearer: [{ key: "token", value: "{{apiKey}}", type: "string" }],
      },
      item: [
        {
          name: "Public",
          item: [
            {
              name: "GET health",
              request: {
                method: "GET",
                auth: { type: "noauth" },
                url: "{{baseUrl}}/api/v1/health",
              },
            },
            {
              name: "GET login page",
              request: {
                method: "GET",
                auth: { type: "noauth" },
                url: "{{baseUrl}}/login",
              },
            },
          ],
        },
        {
          name: "Authenticated GETs",
          item: authGets.map((path) => ({
            name: `GET ${path}`,
            request: {
              method: "GET",
              header: [
                { key: "Authorization", value: "Bearer {{apiKey}}" },
              ],
              url: `{{baseUrl}}${path}`,
            },
          })),
        },
        {
          name: "Mutations",
          item: [
            {
              name: "POST presence",
              request: {
                method: "POST",
                header: [
                  { key: "Authorization", value: "Bearer {{apiKey}}" },
                  { key: "Content-Type", value: "application/json" },
                ],
                body: {
                  mode: "raw",
                  raw: '{\n  "clientId": {{clientId}}\n}',
                },
                url: "{{baseUrl}}/api/v1/presence",
              },
            },
            {
              name: "PATCH notifications mark read",
              request: {
                method: "PATCH",
                header: [
                  { key: "Authorization", value: "Bearer {{apiKey}}" },
                  { key: "Content-Type", value: "application/json" },
                ],
                body: { mode: "raw", raw: "{}" },
                url: "{{baseUrl}}/api/v1/notifications",
              },
            },
            {
              name: "GET client by id",
              request: {
                method: "GET",
                header: [
                  { key: "Authorization", value: "Bearer {{apiKey}}" },
                ],
                url: "{{baseUrl}}/api/v1/clients/{{clientId}}",
              },
            },
            {
              name: "POST AI summarize",
              request: {
                method: "POST",
                header: [
                  { key: "Authorization", value: "Bearer {{apiKey}}" },
                  { key: "Content-Type", value: "application/json" },
                ],
                body: {
                  mode: "raw",
                  raw: '{\n  "clientId": {{clientId}}\n}',
                },
                url: "{{baseUrl}}/api/v1/ai/summarize-launch",
              },
            },
            {
              name: "POST jobs recurring-tick",
              request: {
                method: "POST",
                header: [
                  { key: "Authorization", value: "Bearer {{apiKey}}" },
                ],
                url: "{{baseUrl}}/api/v1/jobs/recurring-tick",
              },
            },
          ],
        },
      ],
    },
    null,
    2,
  ),
);

console.log(
  `\nSummary: ${results.filter((r) => r.ok).length}/${results.length} "ok" (2xx/3xx)`,
);
console.log("Wrote reports/api-smoke-public.json");
console.log("Wrote postman/VirtualClinicOS.postman_collection.json");
