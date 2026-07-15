"use client";

import { useState, useTransition } from "react";
import { createTask } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";

export function CreateTaskForm({
  clientId,
  clientOptions,
}: {
  clientId?: number;
  clientOptions: { id: number; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("Ops");
  const [due, setDue] = useState("In 3d");
  const [priority, setPriority] = useState<"Urgent" | "High" | "Medium" | "Low">(
    "Medium",
  );
  const [selectedClient, setSelectedClient] = useState(
    clientId ?? clientOptions[0]?.id ?? 0,
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-9 rounded-lg border border-vco-border bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        + Task
      </button>
    );
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2 rounded-xl border border-vco-border bg-white p-2 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          try {
            await createTask({
              clientId: selectedClient,
              title,
              priority,
              owner,
              due,
            });
            push("Task created");
            setOpen(false);
            setTitle("");
          } catch {
            push("Could not create task", "err");
          }
        });
      }}
    >
      {!clientId ? (
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(Number(e.target.value))}
          className="h-8 rounded-md border border-vco-border px-2 text-sm"
        >
          {clientOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      ) : null}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        required
        className="h-8 min-w-[160px] flex-1 rounded-md border border-vco-border px-2 text-sm"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as typeof priority)}
        className="h-8 rounded-md border border-vco-border px-2 text-sm"
      >
        <option value="Urgent">Urgent</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>
      <input
        value={owner}
        onChange={(e) => setOwner(e.target.value)}
        className="h-8 w-24 rounded-md border border-vco-border px-2 text-sm"
      />
      <input
        value={due}
        onChange={(e) => setDue(e.target.value)}
        className="h-8 w-24 rounded-md border border-vco-border px-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-8 rounded-md bg-[#2E5BFF] px-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="h-8 px-2 text-sm text-slate-500"
      >
        Cancel
      </button>
    </form>
  );
}
