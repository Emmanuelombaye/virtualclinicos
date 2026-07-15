"use client";

import { useTransition } from "react";
import { updateClientWaiting } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import type { WaitingOn } from "@/lib/types";

export function WaitingOnEditor({
  clientId,
  waitingOn,
  waitDays,
}: {
  clientId: number;
  waitingOn: WaitingOn;
  waitDays: number;
}) {
  const [pending, startTransition] = useTransition();
  const { push } = useToast();

  return (
    <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg bg-[#EFF4FF] px-3.5 py-3">
      <label className="text-sm text-[#1E40FF]">
        <span className="mb-1 block text-[11px] font-semibold tracking-wide uppercase">
          Waiting on
        </span>
        <select
          defaultValue={waitingOn}
          disabled={pending}
          id={`wait-on-${clientId}`}
          className="h-8 rounded-md border border-[#CDDBFF] bg-white px-2 text-sm font-semibold text-[#1E40FF]"
        >
          <option value="Nothing">Nothing</option>
          <option value="Client">Client</option>
          <option value="Internal">Internal</option>
        </select>
      </label>
      <label className="text-sm text-[#1E40FF]">
        <span className="mb-1 block text-[11px] font-semibold tracking-wide uppercase">
          Days
        </span>
        <input
          type="number"
          min={0}
          defaultValue={waitDays}
          disabled={pending}
          id={`wait-days-${clientId}`}
          className="h-8 w-20 rounded-md border border-[#CDDBFF] bg-white px-2 text-sm font-semibold text-[#1E40FF]"
        />
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const on = (
            document.getElementById(`wait-on-${clientId}`) as HTMLSelectElement
          ).value as WaitingOn;
          const days = Number(
            (document.getElementById(`wait-days-${clientId}`) as HTMLInputElement)
              .value,
          );
          startTransition(async () => {
            try {
              await updateClientWaiting({
                clientId,
                waitingOn: on,
                waitDays: days,
              });
              push("Waiting status updated");
            } catch {
              push("Could not update waiting status", "err");
            }
          });
        }}
        className="h-8 rounded-md bg-[#2E5BFF] px-3 text-xs font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
