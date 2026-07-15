"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";

type Template = { id: string; name: string; slug: string };

export function NewClientButton({
  lockedAeId,
}: {
  lockedAeId?: "maya" | "devon" | "priya";
}) {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [aeId, setAeId] = useState<"maya" | "devon" | "priya">(
    lockedAeId ?? "maya",
  );
  const [templateId, setTemplateId] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    void fetch("/api/v1/templates")
      .then((r) => r.json())
      .then((j) => setTemplates(j.data ?? []))
      .catch(() => undefined);
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-9 rounded-lg bg-[#2E5BFF] px-3.5 text-sm font-semibold text-white hover:bg-[#1E40FF]"
      >
        + New Client
      </button>
    );
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2 rounded-xl border border-vco-border bg-white p-2 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          try {
            if (templateId) {
              const res = await fetch("/api/v1/clients/from-template", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  templateId,
                  name,
                  aeId: lockedAeId ?? aeId,
                }),
              });
              const j = await res.json();
              if (!res.ok) throw new Error(j.error ?? "Failed");
              push("Client created from template");
              setOpen(false);
              setName("");
              router.push(`/clients/${j.data.id}`);
              router.refresh();
              return;
            }
            const res = await createClient({
              name,
              aeId: lockedAeId ?? aeId,
            });
            push("Client created");
            setOpen(false);
            setName("");
            router.push(`/clients/${res.id}`);
            router.refresh();
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to create";
            setError(msg);
            push(msg, "err");
          }
        });
      }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Clinic name"
        required
        className="h-8 rounded-md border border-vco-border px-2 text-sm outline-none focus:border-[#2E5BFF]"
      />
      <select
        value={templateId}
        onChange={(e) => setTemplateId(e.target.value)}
        className="h-8 rounded-md border border-vco-border px-2 text-sm"
      >
        <option value="">Blank (default gates)</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      {lockedAeId ? null : (
        <select
          value={aeId}
          onChange={(e) => setAeId(e.target.value as typeof aeId)}
          className="h-8 rounded-md border border-vco-border px-2 text-sm"
        >
          <option value="maya">Maya Chen</option>
          <option value="devon">Devon Ray</option>
          <option value="priya">Priya Nair</option>
        </select>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-8 rounded-md bg-[#2E5BFF] px-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Create"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="h-8 rounded-md px-2 text-sm text-slate-500"
      >
        Cancel
      </button>
      {error ? <span className="text-xs text-[#B42318]">{error}</span> : null}
    </form>
  );
}
