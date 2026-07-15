"use client";

import { useEffect, useState } from "react";

type Ev = {
  id: string;
  title: string;
  date: string;
  kind: string;
  clientName: string;
  clientId: number;
};

export function CalendarClient() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    void fetch("/api/v1/calendar")
      .then((r) => r.json())
      .then((j) => {
        setDisabled(!!j.disabled);
        setEvents(j.data ?? []);
      });
  }, []);

  if (disabled) {
    return <p className="text-sm text-vco-muted">Calendar feature flag is off.</p>;
  }

  const byDate = new Map<string, Ev[]>();
  for (const e of events) {
    const list = byDate.get(e.date) ?? [];
    list.push(e);
    byDate.set(e.date, list);
  }
  const dates = [...byDate.keys()].sort();

  return (
    <div className="space-y-4">
      {dates.slice(0, 40).map((date) => (
        <div key={date} className="rounded-lg border border-vco-border bg-white p-3">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {date}
          </div>
          <ul className="mt-2 space-y-1">
            {(byDate.get(date) ?? []).map((e) => (
              <li key={e.id} className="text-sm text-slate-700">
                <span className="mr-2 rounded bg-slate-100 px-1.5 text-[10px] font-semibold uppercase text-slate-500">
                  {e.kind}
                </span>
                <a href={`/clients/${e.clientId}`} className="font-medium text-[#1E40FF]">
                  {e.title}
                </a>
                <span className="text-slate-400"> · {e.clientName}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {!dates.length ? (
        <p className="text-sm text-vco-muted">No milestones in range.</p>
      ) : null}
    </div>
  );
}
