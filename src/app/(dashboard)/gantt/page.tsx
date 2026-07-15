import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { getSessionUser } from "@/lib/auth/session";
import { getAllClients } from "@/lib/queries";
import Link from "next/link";

export default async function GanttPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const clients = (await getAllClients(user))
    .filter((c) => c.daysToLaunch > 0)
    .sort((a, b) => a.daysToLaunch - b.daysToLaunch);

  const maxDays = Math.max(90, ...clients.map((c) => c.daysToLaunch), 1);

  return (
    <div>
      <PageHeader
        title="Launch Gantt"
        subtitle="Lightweight timeline — full drag Gantt deferred"
        showNewClient={false}
      />
      {clients.length === 0 ? (
        <p className="text-sm text-vco-muted">No upcoming launches.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-vco-border bg-white p-4">
          <div className="mb-2 flex justify-between text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
            <span>Today</span>
            <span>{maxDays}d</span>
          </div>
          <ul className="space-y-3">
            {clients.map((c) => {
              const width = Math.max(8, (c.daysToLaunch / maxDays) * 100);
              return (
                <li key={c.id} className="grid grid-cols-[160px_1fr] gap-3 items-center">
                  <Link
                    href={`/clients/${c.id}`}
                    className="truncate text-sm font-semibold text-[#1E40FF]"
                  >
                    {c.name}
                  </Link>
                  <div className="relative h-7 rounded-md bg-slate-100">
                    <div
                      className="absolute inset-y-0 left-0 flex items-center rounded-md bg-[#2E5BFF] px-2 text-[11px] font-semibold text-white"
                      style={{ width: `${width}%` }}
                      title={`P${c.phase} · ${c.daysToLaunch}d`}
                    >
                      {c.daysToLaunch}d · {c.completion}%
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
