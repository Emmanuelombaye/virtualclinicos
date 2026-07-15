"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HealthDot } from "@/components/ui/HealthPill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { clientInitial } from "@/lib/ui";
import type { DerivedClient, Health } from "@/lib/types";

type SavedView = {
  id: string;
  name: string;
  filterJson: string;
};

type Filter = {
  health?: Health;
  minDays?: number;
  highRisk?: boolean;
};

function applyFilter(clients: DerivedClient[], filter: Filter) {
  return clients.filter((c) => {
    if (filter.health && c.health !== filter.health) return false;
    if (filter.minDays != null && c.daysToLaunch < filter.minDays) return false;
    if (filter.highRisk && c.health !== "red" && c.criticalOverdue < 1) {
      return false;
    }
    return true;
  });
}

export function ClientsTable({
  clients,
  initialViews,
}: {
  clients: DerivedClient[];
  initialViews: SavedView[];
}) {
  const router = useRouter();
  const [views, setViews] = useState(initialViews);
  const [activeId, setActiveId] = useState<string | "all">("all");
  const [chip, setChip] = useState<Filter>({});
  const [pending, start] = useTransition();
  const [saveName, setSaveName] = useState("");

  const activeFilter = useMemo(() => {
    if (activeId === "all") return chip;
    const view = views.find((v) => v.id === activeId);
    if (!view) return chip;
    try {
      return { ...chip, ...(JSON.parse(view.filterJson) as Filter) };
    } catch {
      return chip;
    }
  }, [activeId, chip, views]);

  const filtered = useMemo(
    () => applyFilter(clients, activeFilter),
    [clients, activeFilter],
  );

  function saveView() {
    if (!saveName.trim()) return;
    start(async () => {
      const res = await fetch("/api/v1/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: saveName.trim(),
          entity: "Client",
          filterJson: JSON.stringify(chip),
          isShared: true,
        }),
      });
      const j = await res.json();
      if (res.ok && j.data) {
        setViews((v) => [...v, j.data]);
        setSaveName("");
        setActiveId(j.data.id);
        router.refresh();
      }
    });
  }

  return (
    <div className={pending ? "opacity-80" : ""}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveId("all");
            setChip({});
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            activeId === "all" && !chip.health && !chip.minDays && !chip.highRisk
              ? "bg-[#EFF4FF] text-[#1E40FF]"
              : "border border-vco-border bg-white text-slate-600"
          }`}
        >
          All
        </button>
        {(
          [
            { label: "Red", f: { health: "red" as Health } },
            { label: "Delayed (≥60d)", f: { minDays: 60 } },
            { label: "High risk", f: { highRisk: true } },
          ] as const
        ).map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => {
              setActiveId("all");
              setChip(c.f);
            }}
            className="rounded-lg border border-vco-border bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            {c.label}
          </button>
        ))}
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => {
              setActiveId(v.id);
              setChip({});
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              activeId === v.id
                ? "bg-[#EFF4FF] text-[#1E40FF]"
                : "border border-vco-border bg-white text-slate-600"
            }`}
          >
            {v.name}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Save view name"
            className="h-8 rounded-lg border border-vco-border px-2 text-xs"
          />
          <button
            type="button"
            onClick={saveView}
            className="h-8 rounded-lg bg-[#2E5BFF] px-2 text-xs font-semibold text-white"
          >
            Save view
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-vco-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-vco-border text-[11px] tracking-wide text-slate-400 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Health</th>
                <th className="px-4 py-3 font-semibold">Phase</th>
                <th className="px-4 py-3 font-semibold">Completion</th>
                <th className="px-4 py-3 font-semibold">Launch</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const urgent = c.daysToLaunch > 0 && c.daysToLaunch <= 5;
                return (
                  <tr
                    key={c.id}
                    className="border-b border-vco-border last:border-0 hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/clients/${c.id}`}
                        className="flex items-center gap-2.5"
                      >
                        <div className="flex size-8 items-center justify-center rounded-full bg-[#EFF4FF] text-xs font-bold text-[#1E40FF]">
                          {clientInitial(c.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-vco-ink">
                            {c.name}
                          </div>
                          <div className="text-xs text-vco-muted">
                            {c.ae.name}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <HealthDot health={c.health} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.phaseLabel}</td>
                    <td className="px-4 py-3">
                      <div className="flex w-36 items-center gap-2">
                        <ProgressBar value={c.completion} />
                        <span className="text-xs font-medium text-slate-500">
                          {c.completion}%
                        </span>
                      </div>
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium ${
                        urgent ? "text-[#B42318]" : "text-slate-600"
                      }`}
                    >
                      {c.launchLabel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-2 text-xs text-vco-muted">
        Showing {filtered.length} of {clients.length}
      </p>
    </div>
  );
}
