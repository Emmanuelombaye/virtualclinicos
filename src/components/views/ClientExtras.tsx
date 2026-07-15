"use client";

import { useEffect, useState } from "react";

export function AskAiPanel({ clientId }: { clientId: number }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/ai/summarize-launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "AI failed");
      setText(j.data.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-vco-border bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-vco-ink">Ask AI</h3>
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          className="rounded-md bg-[#2E5BFF] px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Thinking…" : "Summarize launch"}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-[#B42318]">{error}</p> : null}
      {text ? (
        <pre className="mt-3 whitespace-pre-wrap text-xs text-slate-700">{text}</pre>
      ) : (
        <p className="mt-2 text-xs text-vco-muted">
          Generate a launch summary and next steps for this client.
        </p>
      )}
    </div>
  );
}

export function CustomFieldsSection({ clientId }: { clientId: number }) {
  const [rows, setRows] = useState<
    { id: string; valueText: string | null; fieldDef: { label: string; key: string } }[]
  >([]);
  const [defs, setDefs] = useState<
    { id: string; label: string; key: string }[]
  >([]);

  useEffect(() => {
    void Promise.all([
      fetch(`/api/v1/custom-fields?entityType=Client&entityId=${clientId}`).then(
        (r) => r.json(),
      ),
      fetch(`/api/v1/custom-fields?entityType=Client`).then((r) => r.json()),
    ]).then(([vals, d]) => {
      setRows(vals.data ?? []);
      setDefs(d.data ?? []);
    });
  }, [clientId]);

  async function save(fieldDefId: string, valueText: string) {
    await fetch("/api/v1/custom-fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fieldDefId,
        entityType: "Client",
        entityId: String(clientId),
        valueText,
      }),
    });
    const vals = await fetch(
      `/api/v1/custom-fields?entityType=Client&entityId=${clientId}`,
    ).then((r) => r.json());
    setRows(vals.data ?? []);
  }

  return (
    <div className="rounded-xl border border-vco-border bg-white p-4">
      <h3 className="text-sm font-semibold text-vco-ink">Custom fields</h3>
      <ul className="mt-3 space-y-2">
        {defs.map((d) => {
          const existing = rows.find((r) => r.fieldDef.key === d.key);
          return (
            <li key={d.id} className="flex items-center gap-2 text-sm">
              <label className="w-32 shrink-0 text-slate-600">{d.label}</label>
              <input
                defaultValue={existing?.valueText ?? ""}
                className="h-8 flex-1 rounded border border-vco-border px-2 text-sm"
                onBlur={(e) => void save(d.id, e.target.value)}
              />
            </li>
          );
        })}
        {!defs.length ? (
          <li className="text-xs text-vco-muted">No custom fields defined.</li>
        ) : null}
      </ul>
    </div>
  );
}

export function PresenceStrip({ clientId }: { clientId: number }) {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    const tick = () => {
      void fetch("/api/v1/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "Client",
          entityId: String(clientId),
        }),
      })
        .then((r) => r.json())
        .then((j) =>
          setNames((j.data ?? []).map((p: { name: string }) => p.name)),
        );
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [clientId]);

  if (!names.length) return null;
  return (
    <div className="text-xs text-slate-500">
      Also viewing: {names.join(", ")}
    </div>
  );
}
