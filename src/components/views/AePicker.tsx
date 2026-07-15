"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const AES = [
  { id: "maya", name: "Maya Chen" },
  { id: "devon", name: "Devon Ray" },
  { id: "priya", name: "Priya Nair" },
] as const;

export function AePicker({
  selectedId,
  canSwitch,
}: {
  selectedId: string;
  canSwitch: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (!canSwitch) return null;

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
        AE
      </span>
      <select
        value={selectedId}
        onChange={(e) => {
          const next = new URLSearchParams(searchParams.toString());
          next.set("ae", e.target.value);
          router.push(`/ae-dashboard?${next.toString()}`);
        }}
        className="h-9 rounded-lg border border-vco-border bg-white px-2.5 text-sm font-semibold text-vco-ink outline-none focus:border-[#2E5BFF]"
      >
        {AES.map((ae) => (
          <option key={ae.id} value={ae.id}>
            {ae.name}
          </option>
        ))}
      </select>
      <Link
        href={`/ae-dashboard?ae=${selectedId}`}
        className="sr-only"
      >
        Refresh
      </Link>
    </label>
  );
}
