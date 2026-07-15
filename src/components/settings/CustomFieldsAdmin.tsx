"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Def = {
  id: string;
  entityType: string;
  key: string;
  label: string;
  fieldType: string;
};

export function CustomFieldsAdmin({ initial }: { initial: Def[] }) {
  const router = useRouter();
  const [defs, setDefs] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form
        className="space-y-3 rounded-xl border border-vco-border bg-white p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          start(async () => {
            setError(null);
            const res = await fetch("/api/v1/custom-fields", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                entityType: String(fd.get("entityType")),
                key: String(fd.get("key")),
                label: String(fd.get("label")),
                fieldType: String(fd.get("fieldType")),
              }),
            });
            const j = await res.json();
            if (!res.ok) {
              setError(j.error ?? "Failed");
              return;
            }
            setDefs((d) => [...d, j.data]);
            (e.target as HTMLFormElement).reset();
            router.refresh();
          });
        }}
      >
        <h2 className="text-sm font-semibold text-vco-ink">Add field</h2>
        <select
          name="entityType"
          className="h-10 w-full rounded-lg border border-vco-border px-3 text-sm"
          defaultValue="Client"
        >
          <option value="Client">Client</option>
          <option value="Task">Task</option>
          <option value="Risk">Risk</option>
        </select>
        <input
          name="key"
          required
          placeholder="key_snake"
          pattern="[a-z][a-z0-9_]*"
          className="h-10 w-full rounded-lg border border-vco-border px-3 text-sm"
        />
        <input
          name="label"
          required
          placeholder="Label"
          className="h-10 w-full rounded-lg border border-vco-border px-3 text-sm"
        />
        <select
          name="fieldType"
          className="h-10 w-full rounded-lg border border-vco-border px-3 text-sm"
          defaultValue="text"
        >
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="boolean">Boolean</option>
          <option value="select">Select</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#2E5BFF] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Create"}
        </button>
        {error ? <p className="text-sm text-[#B42318]">{error}</p> : null}
      </form>

      <div className="rounded-xl border border-vco-border bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-vco-ink">Defined fields</h2>
        <ul className="space-y-2 text-sm">
          {defs.map((d) => (
            <li
              key={d.id}
              className="flex justify-between border-b border-vco-border py-2 last:border-0"
            >
              <span>
                <span className="font-medium text-vco-ink">{d.label}</span>
                <span className="block text-[11px] text-vco-muted">
                  {d.entityType} · {d.key} · {d.fieldType}
                </span>
              </span>
            </li>
          ))}
          {defs.length === 0 ? (
            <li className="text-vco-muted">No custom fields yet.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
