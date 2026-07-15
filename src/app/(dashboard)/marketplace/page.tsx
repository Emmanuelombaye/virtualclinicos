"use client";

import { useEffect, useState } from "react";

type Plugin = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  installed: boolean;
};

export default function MarketplacePage() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);

  async function load() {
    const j = await fetch("/api/v1/plugins").then((r) => r.json());
    setPlugins(j.data ?? []);
  }
  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold">Marketplace</h1>
      <p className="mt-1 text-sm text-vco-muted">Install stub integrations</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {plugins.map((p) => (
          <div key={p.id} className="rounded border bg-white p-4">
            <div className="font-semibold">{p.name}</div>
            <p className="mt-1 text-xs text-slate-500">{p.description}</p>
            <button
              type="button"
              disabled={p.installed}
              className="mt-3 rounded bg-[#2E5BFF] px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
              onClick={async () => {
                await fetch("/api/v1/plugins", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ pluginId: p.id }),
                });
                void load();
              }}
            >
              {p.installed ? "Installed" : "Install"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
