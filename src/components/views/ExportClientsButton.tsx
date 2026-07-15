"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { hasPermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";

export function ExportClientsButton({ user }: { user: AuthUser }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  if (!hasPermission(user, "reports.export")) {
    return null;
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void (async () => {
          try {
            const res = await fetch("/api/v1/exports/clients");
            if (!res.ok) throw new Error("Export failed");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "clients.csv";
            a.click();
            URL.revokeObjectURL(url);
            router.refresh();
          } finally {
            setBusy(false);
          }
        })();
      }}
      className="inline-flex h-9 items-center rounded-lg border border-vco-border bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
    >
      {busy ? "Exporting…" : "Export CSV"}
    </button>
  );
}
