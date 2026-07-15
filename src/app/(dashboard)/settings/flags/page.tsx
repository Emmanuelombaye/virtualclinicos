"use client";

import { useEffect, useState } from "react";

type Flag = { id: string; key: string; enabled: boolean; description: string | null };

export default function FlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([]);

  async function load() {
    const j = await fetch("/api/v1/flags").then((r) => r.json());
    setFlags(j.data ?? []);
  }
  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold">Feature flags</h1>
      <ul className="mt-4 space-y-2">
        {flags.map((f) => (
          <li
            key={f.id}
            className="flex items-center justify-between rounded border bg-white px-3 py-2 text-sm"
          >
            <div>
              <div className="font-semibold">{f.key}</div>
              <div className="text-xs text-slate-500">{f.description}</div>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-[#1E40FF]"
              onClick={async () => {
                await fetch("/api/v1/flags", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    key: f.key,
                    enabled: !f.enabled,
                    description: f.description ?? undefined,
                  }),
                });
                void load();
              }}
            >
              {f.enabled ? "On" : "Off"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
