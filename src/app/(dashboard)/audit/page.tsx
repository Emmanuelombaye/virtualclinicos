import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { canViewAudit } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";
import { listAuditLogs } from "@/lib/audit";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!canViewAudit(user)) redirect("/command-center");

  const sp = await searchParams;
  const entityType = sp.entityType?.trim() || undefined;

  const logs = await listAuditLogs(user, { entityType, limit: 200 });

  const types = [
    "All",
    "Client",
    "ClientGate",
    "Task",
    "Risk",
    "Comm",
  ] as const;

  return (
    <div>
      <PageHeader
        title="Audit"
        subtitle="Organization activity trail"
        showNewClient={false}
        actions={
          <a
            href="/api/v1/audit/export?format=csv"
            className="inline-flex h-9 items-center rounded-lg border border-vco-border bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Export CSV
          </a>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {types.map((t) => {
          const href =
            t === "All" ? "/audit" : `/audit?entityType=${encodeURIComponent(t)}`;
          const active =
            t === "All" ? !entityType : entityType === t;
          return (
            <a
              key={t}
              href={href}
              className={
                active
                  ? "rounded-lg bg-[#EFF4FF] px-3 py-1.5 text-xs font-semibold text-[#1E40FF]"
                  : "rounded-lg border border-vco-border bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              }
            >
              {t}
            </a>
          );
        })}
      </div>

      {logs.length === 0 ? (
        <EmptyState
          title="No audit events yet"
          body="Mutations on clients, gates, tasks, risks, and comms will appear here."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-vco-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-vco-border bg-slate-50 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Change</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-vco-border last:border-0"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-vco-muted">
                    {log.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-vco-ink">
                      {log.actor?.name ?? "System"}
                    </div>
                    <div className="text-[11px] text-vco-muted">
                      {log.actor?.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-vco-ink">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 text-vco-muted">
                    {log.entityType}{" "}
                    <span className="font-mono text-[11px]">
                      {log.entityId.slice(0, 12)}
                    </span>
                  </td>
                  <td className="max-w-[280px] truncate px-4 py-3 font-mono text-[11px] text-slate-500">
                    {log.afterJson ?? log.beforeJson ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
