"use client";

import { useEffect, useState } from "react";

type Rule = {
  id: string;
  name: string;
  trigger: string;
  enabled: boolean;
  actionsJson: string;
};

export default function AutomationsSettingsPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [name, setName] = useState("Gate complete follow-up");
  const [trigger, setTrigger] = useState("gate.complete");
  const [msg, setMsg] = useState("");

  async function load() {
    const j = await fetch("/api/v1/automations").then((r) => r.json());
    setRules(j.data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggle(id: string, enabled: boolean) {
    await fetch("/api/v1/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
    void load();
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const actionsJson = JSON.stringify([
      {
        type: "create_task",
        title: "Follow up after automation",
        priority: "High",
        owner: "System",
      },
      {
        type: "notify",
        roleSlugs: ["ae", "ceo"],
        title: "Automation fired",
        body: name,
      },
      { type: "activity", summary: `Automation "${name}" ran` },
    ]);
    const res = await fetch("/api/v1/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, trigger, actionsJson, enabled: true }),
    });
    setMsg(res.ok ? "Created" : "Failed");
    void load();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-vco-ink">Automations</h1>
      <p className="mt-1 text-sm text-vco-muted">Minimal rule engine</p>
      <ul className="mt-4 space-y-2">
        {rules.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between rounded border border-vco-border bg-white px-3 py-2 text-sm"
          >
            <div>
              <div className="font-semibold">{r.name}</div>
              <div className="text-xs text-slate-500">{r.trigger}</div>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-[#1E40FF]"
              onClick={() => void toggle(r.id, !r.enabled)}
            >
              {r.enabled ? "Disable" : "Enable"}
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={(e) => void create(e)} className="mt-6 space-y-2 rounded border border-vco-border bg-white p-3">
        <div className="text-sm font-semibold">New rule</div>
        <input
          className="h-8 w-full rounded border px-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="h-8 w-full rounded border px-2 text-sm"
          value={trigger}
          onChange={(e) => setTrigger(e.target.value)}
        >
          <option value="gate.complete">gate.complete</option>
          <option value="task.created">task.created</option>
          <option value="risk.critical">risk.critical</option>
        </select>
        <button type="submit" className="rounded bg-[#2E5BFF] px-3 py-1.5 text-xs font-semibold text-white">
          Create
        </button>
        {msg ? <span className="ml-2 text-xs">{msg}</span> : null}
      </form>

      <div className="mt-6 rounded border border-vco-border bg-white p-3">
        <div className="text-sm font-semibold">Ops jobs</div>
        <p className="mt-1 text-xs text-vco-muted">
          Expand recurring tasks and send due-task digests (respects user email prefs).
        </p>
        <button
          type="button"
          className="mt-2 rounded border border-vco-border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => {
            void fetch("/api/v1/jobs/recurring-tick", { method: "POST" })
              .then((r) => r.json())
              .then((j) =>
                setMsg(
                  j.data
                    ? `Jobs ok — digests to ${j.data.digest?.notified ?? 0} users`
                    : j.error ?? "Failed",
                ),
              );
          }}
        >
          Run recurring + digests now
        </button>
      </div>
    </div>
  );
}
