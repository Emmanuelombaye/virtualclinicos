"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const OPTIONS = [
  { id: "revenue", label: "Revenue / MRR" },
  { id: "tasks", label: "Tasks / overdue" },
  { id: "risks", label: "Risks" },
  { id: "launches", label: "Launches" },
  { id: "delay", label: "Delay risk" },
] as const;

export function WidgetToggle({ initial }: { initial: string[] }) {
  const router = useRouter();
  const [widgets, setWidgets] = useState<string[]>(
    initial.length ? initial : OPTIONS.map((o) => o.id),
  );
  const [pending, start] = useTransition();

  function toggle(id: string) {
    const next = widgets.includes(id)
      ? widgets.filter((w) => w !== id)
      : [...widgets, id];
    setWidgets(next);
    start(async () => {
      await fetch("/api/v1/dashboard-layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets }),
      }).catch(() => undefined);
      // send next after state — fix race by posting next
      await fetch("/api/v1/dashboard-layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets: next }),
      }).catch(() => undefined);
      router.refresh();
    });
  }

  return (
    <div
      className={`mb-4 flex flex-wrap gap-2 ${pending ? "opacity-70" : ""}`}
    >
      <span className="self-center text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
        Widgets
      </span>
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => toggle(o.id)}
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
            widgets.includes(o.id)
              ? "bg-[#EFF4FF] text-[#1E40FF]"
              : "border border-vco-border bg-white text-slate-500"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
