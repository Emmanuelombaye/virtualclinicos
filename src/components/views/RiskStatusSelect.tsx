"use client";

import { useTransition } from "react";
import { updateRiskStatus } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import type { RiskStatus } from "@/lib/types";

const OPTIONS: RiskStatus[] = ["Open", "Mitigating", "Closed"];

export function RiskStatusSelect({
  riskId,
  status,
}: {
  riskId: string;
  status: RiskStatus;
}) {
  const [pending, startTransition] = useTransition();
  const { push } = useToast();

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as RiskStatus;
        startTransition(async () => {
          try {
            await updateRiskStatus({ riskId, status: next });
            push("Risk updated");
          } catch {
            push("Could not update risk", "err");
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
