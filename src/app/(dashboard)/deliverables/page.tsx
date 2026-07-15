import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeliverablesClientPicker } from "@/components/views/DeliverablesClientPicker";
import { GateStatusSelect } from "@/components/views/GateStatusSelect";
import { getSessionUser } from "@/lib/auth/session";
import {
  deliverableStats,
  getAllClients,
  getClientById,
} from "@/lib/queries";

export default async function DeliverablesPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const clients = await getAllClients(user);
  const selectedId = Number(sp.client) || clients[0]?.id || 1;
  const client = (await getClientById(selectedId, user)) ?? clients[0];
  if (!client) {
    return (
      <div>
        <PageHeader title="Deliverables" subtitle="No clients yet" />
        <EmptyState title="No clients" body="Create a client to track launch gates." />
      </div>
    );
  }
  const stats = await deliverableStats(client);

  return (
    <div>
      <PageHeader
        title="Deliverables"
        subtitle="The 24 launch gates that define done"
        actions={
          <div className="flex gap-2">
            <StatChip label={`${stats.complete} Complete`} tone="green" />
            <StatChip label={`${stats.inFlight} In Flight`} tone="amber" />
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-vco-muted">
          Launch gates for
        </span>
        <DeliverablesClientPicker
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          selectedId={client.id}
        />
        <div className="ml-auto flex gap-2 text-xs font-semibold">
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600">
            {stats.notStarted} Not Started
          </span>
          <span className="rounded-lg bg-[#FEF3F2] px-2.5 py-1 text-[#B42318]">
            {stats.criticalLeft} Critical Left
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-vco-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-vco-border text-[11px] tracking-wide text-slate-400 uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Deliverable</th>
              <th className="px-4 py-3 font-semibold">Phase</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Owner Type</th>
              <th className="px-4 py-3 font-semibold">Critical</th>
            </tr>
          </thead>
          <tbody>
            {client.gates.map((g) => (
              <tr
                key={g.name}
                className="border-b border-vco-border last:border-0"
              >
                <td className="px-4 py-3 font-medium text-vco-ink">{g.name}</td>
                <td className="px-4 py-3 text-slate-600">P{g.phase}</td>
                <td className="px-4 py-3">
                  {g.id ? (
                    <GateStatusSelect gateId={g.id} status={g.status} />
                  ) : (
                    <Badge label={g.status} />
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      g.ownerType === "Client"
                        ? "font-medium text-[#B54708]"
                        : "font-medium text-[#1E40FF]"
                    }
                  >
                    {g.ownerType}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#F59E0B]">
                  {g.critical ? "★" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatChip({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "amber";
}) {
  return (
    <span
      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
        tone === "green"
          ? "bg-[#ECFDF3] text-[#067647]"
          : "bg-[#FFFAEB] text-[#B54708]"
      }`}
    >
      {label}
    </span>
  );
}
