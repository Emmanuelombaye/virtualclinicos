"use client";

import { useEffect, useState } from "react";

export function DbStatusBanner() {
  const [down, setDown] = useState(false);

  useEffect(() => {
    void fetch("/api/v1/health")
      .then((r) => r.json())
      .then((j) => {
        if (j?.db === "down") setDown(true);
      })
      .catch(() => setDown(true));
  }, []);

  if (!down) return null;

  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-950">
      <p className="font-semibold">Database unavailable on this host</p>
      <p className="mt-1 text-amber-900/80">
        Vercel cannot use local SQLite. Add a Neon/Supabase Postgres{" "}
        <code className="rounded bg-amber-100 px-1">DATABASE_URL</code>, switch
        Prisma to <code className="rounded bg-amber-100 px-1">postgresql</code>,
        push schema + seed — see <strong>VERCEL.md</strong> in the repo.
      </p>
    </div>
  );
}
