"use client";

import { useTransition } from "react";
import { markNotificationsReadAction } from "@/lib/actions";

export function MarkAllReadButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-lg border border-vco-border bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      onClick={() =>
        start(async () => {
          await markNotificationsReadAction();
        })
      }
    >
      {pending ? "Updating…" : "Mark all read"}
    </button>
  );
}
