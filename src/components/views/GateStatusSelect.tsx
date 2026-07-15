"use client";

import { useTransition } from "react";
import { updateGateStatus } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import type { GateStatus } from "@/lib/types";

const OPTIONS: GateStatus[] = ["Not Started", "In Progress", "Complete"];

export function GateStatusSelect({
  gateId,
  status,
}: {
  gateId: string;
  status: GateStatus;
}) {
  const [pending, startTransition] = useTransition();
  const { push } = useToast();

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as GateStatus;
        startTransition(async () => {
          try {
            await updateGateStatus({ gateId, status: next });
            push("Deliverable updated");
          } catch {
            push("Could not update deliverable", "err");
          }
        });
      }}
      className="h-8 rounded-full border border-vco-border bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#2E5BFF] disabled:opacity-60"
    >
      {OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
