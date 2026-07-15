"use client";

import { useMemo, useState, useTransition } from "react";
import { updateRolePermissionsAction } from "@/lib/actions";

export function RolePermissionsEditor({
  role,
  catalog,
  locked,
}: {
  role: {
    id: string;
    name: string;
    slug: string;
    isSystem: boolean;
    userCount: number;
    permissions: string[];
  };
  catalog: { id: string; label: string }[];
  locked?: boolean;
}) {
  const [selected, setSelected] = useState(() => new Set(role.permissions));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...catalog].sort((a, b) => a.label.localeCompare(b.label)),
    [catalog],
  );

  return (
    <section className="rounded-xl border border-vco-border bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-vco-ink">{role.name}</h2>
          <p className="text-[11px] text-vco-muted">
            {role.slug}
            {role.isSystem ? " · system" : ""} · {role.userCount} users
          </p>
        </div>
        {!locked ? (
          <button
            type="button"
            disabled={pending}
            className="rounded-lg bg-[#2E5BFF] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            onClick={() =>
              start(async () => {
                setMsg(null);
                await updateRolePermissionsAction({
                  roleId: role.id,
                  permissions: [...selected],
                });
                setMsg("Saved");
              })
            }
          >
            {pending ? "Saving…" : "Save"}
          </button>
        ) : (
          <span className="text-xs text-vco-muted">Locked</span>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((p) => (
          <label key={p.id} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              disabled={locked}
              checked={selected.has(p.id)}
              onChange={(e) => {
                setSelected((prev) => {
                  const next = new Set(prev);
                  if (e.target.checked) next.add(p.id);
                  else next.delete(p.id);
                  return next;
                });
              }}
            />
            <span>
              <span className="font-medium text-vco-ink">{p.label}</span>
              <span className="block text-[10px] text-slate-400">{p.id}</span>
            </span>
          </label>
        ))}
      </div>
      {msg ? <p className="mt-2 text-xs text-emerald-700">{msg}</p> : null}
    </section>
  );
}
