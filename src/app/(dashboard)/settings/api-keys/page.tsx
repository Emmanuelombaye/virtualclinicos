"use client";

import { useEffect, useState } from "react";

type Key = {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<Key[]>([]);
  const [name, setName] = useState("CI key");
  const [raw, setRaw] = useState<string | null>(null);

  async function load() {
    const j = await fetch("/api/v1/api-keys").then((r) => r.json());
    setKeys(j.data ?? []);
  }
  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold">API Keys</h1>
      <p className="mt-1 text-sm text-vco-muted">
        Use Authorization: Bearer &lt;token&gt; on /api/v1/*
      </p>
      {raw ? (
        <div className="mt-3 rounded bg-amber-50 p-3 text-xs break-all">
          Copy now (shown once): <strong>{raw}</strong>
        </div>
      ) : null}
      <ul className="mt-4 space-y-2">
        {keys.map((k) => (
          <li
            key={k.id}
            className="flex items-center justify-between rounded border bg-white px-3 py-2 text-sm"
          >
            <div>
              <div className="font-semibold">{k.name}</div>
              <div className="text-xs text-slate-500">
                {k.prefix}… {k.revokedAt ? "(revoked)" : ""}
              </div>
            </div>
            {!k.revokedAt ? (
              <button
                type="button"
                className="text-xs font-semibold text-red-600"
                onClick={async () => {
                  await fetch("/api/v1/api-keys", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ revokeId: k.id }),
                  });
                  void load();
                }}
              >
                Revoke
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      <form
        className="mt-4 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await fetch("/api/v1/api-keys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, scopes: ["clients.view"] }),
          });
          const j = await res.json();
          if (j.data?.token) setRaw(j.data.token);
          void load();
        }}
      >
        <input
          className="h-8 rounded border px-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="rounded bg-[#2E5BFF] px-3 text-xs font-semibold text-white">
          Create
        </button>
      </form>
    </div>
  );
}
