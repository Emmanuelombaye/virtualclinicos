"use client";

import { useRouter } from "next/navigation";

export function DeliverablesClientPicker({
  clients,
  selectedId,
}: {
  clients: { id: number; name: string }[];
  selectedId: number;
}) {
  const router = useRouter();

  return (
    <select
      value={selectedId}
      onChange={(e) => {
        router.push(`/deliverables?client=${e.target.value}`);
      }}
      className="h-9 rounded-lg border border-vco-border bg-white px-3 text-sm font-medium text-vco-ink outline-none focus:border-[#2E5BFF]"
    >
      {clients.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
