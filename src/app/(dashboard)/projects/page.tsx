import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { HealthDot } from "@/components/ui/HealthPill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getSessionUser } from "@/lib/auth/session";
import { projectsByPhase } from "@/lib/queries";
import { clientInitial } from "@/lib/ui";

export default async function ProjectsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const columns = await projectsByPhase(user);

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Implementation pipeline by phase"
      />

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-3">
          {columns.map(({ phase, clients }) => (
            <div key={phase.id} className="w-[200px] shrink-0">
              <div className="mb-2 flex items-baseline justify-between px-1">
                <div className="text-sm font-semibold text-vco-ink">
                  {phase.code} {phase.name}
                </div>
                <div className="text-xs font-semibold text-vco-muted">
                  {clients.length}
                </div>
              </div>
              <div className="mb-3 h-0.5 rounded-full bg-[#2E5BFF]" />
              <div className="space-y-2">
                {clients.map((c) => {
                  const urgent = c.daysToLaunch > 0 && c.daysToLaunch <= 5;
                  return (
                    <Link
                      key={c.id}
                      href={`/clients/${c.id}`}
                      className="block rounded-xl border border-vco-border bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:border-[#CDDBFF]"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#EFF4FF] text-[11px] font-bold text-[#1E40FF]">
                          {clientInitial(c.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <div className="truncate text-[13px] font-semibold text-vco-ink">
                              {c.name}
                            </div>
                            <HealthDot health={c.health} />
                          </div>
                          <div className="mt-0.5 text-[11px] text-vco-muted">
                            {c.ae.name}
                          </div>
                          <div className="mt-2">
                            <ProgressBar
                              value={c.completion}
                              tone={urgent ? "red" : "blue"}
                            />
                          </div>
                          <div
                            className={`mt-1.5 text-[11px] font-medium ${
                              urgent
                                ? "text-[#B42318]"
                                : c.daysToLaunch < 0
                                  ? "text-[#067647]"
                                  : "text-slate-500"
                            }`}
                          >
                            {urgent ? `${c.launchLabel} !` : c.launchLabel}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
