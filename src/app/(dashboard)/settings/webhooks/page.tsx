"use client";

import { useEffect, useState } from "react";

type Wh = {
  id: string;
  url: string;
  eventsJson: string;
  enabled: boolean;
  secret: string;
  deliveries: { id: string; event: string; status: string }[];
};

export default function WebhooksPage() {
  const [rows, setRows] = useState<Wh[]>([]);
  const [url, setUrl] = useState("https://example.com/hooks/vco");

  async function load() {
    const j = await fetch("/api/v1/webhooks").then((r) => r.json());
    setRows(j.data ?? []);
  }
  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold">Webhooks</h1>
      <ul className="mt-4 space-y-2">
        {rows.map((w) => (
          <li key={w.id} className="rounded border bg-white p-3 text-sm">
            <div className="font-semibold break-all">{w.url}</div>
            <div className="text-xs text-slate-500">{w.eventsJson}</div>
            <div className="mt-1 text-xs">
              Recent:{" "}
              {(w.deliveries ?? [])
                .map((d) => `${d.event}:${d.status}`)
                .join(", ") || "none"}
            </div>
            <button
              type="button"
              className="mt-2 text-xs text-red-600"
              onClick={async () => {
                await fetch(`/api/v1/webhooks?id=${w.id}`, { method: "DELETE" });
                void load();
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-4 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await fetch("/api/v1/webhooks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url,
              events: ["task.created", "gate.status", "risk.critical", "client.created"],
            }),
          });
          void load();
        }}
      >
        <input
          className="h-8 flex-1 rounded border px-2 text-sm"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit" className="rounded bg-[#2E5BFF] px-3 text-xs font-semibold text-white">
          Add
        </button>
      </form>
    </div>
  );
}
