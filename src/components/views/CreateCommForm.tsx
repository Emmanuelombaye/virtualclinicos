"use client";

import { useState, useTransition } from "react";
import { createComm } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";

export function CreateCommForm({ clientId }: { clientId: number }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [channel, setChannel] = useState<"Email" | "Call" | "Slack">("Email");
  const [pending, startTransition] = useTransition();
  const { push } = useToast();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-8 rounded-lg border border-vco-border bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        + Comm
      </button>
    );
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          try {
            await createComm({ clientId, subject, channel });
            push("Comm logged");
            setSubject("");
            setOpen(false);
          } catch {
            push("Could not log comm", "err");
          }
        });
      }}
    >
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        required
        className="h-8 min-w-[180px] flex-1 rounded-md border border-vco-border px-2 text-sm"
      />
      <select
        value={channel}
        onChange={(e) => setChannel(e.target.value as typeof channel)}
        className="h-8 rounded-md border border-vco-border px-2 text-sm"
      >
        <option value="Email">Email</option>
        <option value="Call">Call</option>
        <option value="Slack">Slack</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="h-8 rounded-md bg-[#2E5BFF] px-3 text-xs font-semibold text-white disabled:opacity-60"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="h-8 px-2 text-xs text-slate-500"
      >
        Cancel
      </button>
    </form>
  );
}
