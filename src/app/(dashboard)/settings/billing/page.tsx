"use client";

import { useEffect, useState, useTransition } from "react";

export default function BillingPage() {
  const [data, setData] = useState<{
    subscription: { plan: string; status: string; seats: number };
    usage: {
      seatsUsed: number;
      apiRequests: number;
      apiErrors: number;
      storageBytes: number;
    };
  } | null>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function reload() {
    void fetch("/api/v1/billing")
      .then((r) => r.json())
      .then((j) => setData(j.data));
  }

  useEffect(() => {
    reload();
  }, []);

  if (!data) return <p className="text-sm text-vco-muted">Loading…</p>;

  return (
    <div>
      <h1 className="text-xl font-semibold">Billing</h1>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded border bg-white p-4">
          <div className="text-xs uppercase text-slate-400">Plan</div>
          <div className="text-2xl font-bold capitalize">
            {data.subscription.plan}
          </div>
          <div className="text-sm text-slate-500">{data.subscription.status}</div>
          <div className="mt-2 text-sm">
            Seats: {data.usage.seatsUsed} / {data.subscription.seats}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["free", "pro", "enterprise"] as const).map((plan) => (
              <button
                key={plan}
                type="button"
                disabled={pending}
                className="rounded-lg border border-vco-border px-3 py-1.5 text-xs font-semibold capitalize hover:bg-slate-50 disabled:opacity-50"
                onClick={() =>
                  start(async () => {
                    setMsg(null);
                    const res = await fetch("/api/v1/billing/checkout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ plan }),
                    });
                    const j = await res.json();
                    if (!res.ok) {
                      setMsg(j.error ?? "Failed");
                      return;
                    }
                    setMsg(j.data.message ?? j.data.note ?? "Updated");
                    reload();
                  })
                }
              >
                {plan}
              </button>
            ))}
          </div>
          {msg ? <p className="mt-2 text-xs text-emerald-700">{msg}</p> : null}
        </div>
        <div className="rounded border bg-white p-4 text-sm">
          <div>API requests (all-time counted): {data.usage.apiRequests}</div>
          <div>API errors: {data.usage.apiErrors}</div>
          <div>Storage: {(data.usage.storageBytes / 1024).toFixed(1)} KB</div>
        </div>
      </div>
    </div>
  );
}
