"use client";

import { stopImpersonationAction } from "@/lib/auth/impersonation-actions";

export function ImpersonationBanner({
  targetName,
}: {
  targetName: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950">
      <span>Viewing as {targetName} — audits record impersonator</span>
      <form action={stopImpersonationAction}>
        <button
          type="submit"
          className="rounded bg-amber-950 px-2 py-1 text-xs font-bold text-amber-50"
        >
          Exit
        </button>
      </form>
    </div>
  );
}
