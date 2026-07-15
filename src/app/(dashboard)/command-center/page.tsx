import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { HealthDot, HealthPill } from "@/components/ui/HealthPill";
import { KpiCard } from "@/components/ui/KpiCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getSessionUser } from "@/lib/auth/session";
import { clientInitial } from "@/lib/ui";
import {
  aeWorkload,
  clientsByHealth,
  portfolioKpis,
  upcomingLaunches,
  waitingSummary,
} from "@/lib/queries";
import { WidgetToggle } from "@/components/views/WidgetToggle";
import { WelcomeChecklist } from "@/components/views/WelcomeChecklist";
import type { DerivedClient, Health } from "@/lib/types";
import { prisma } from "@/lib/db";
import { computeDelayRisk } from "@/lib/delay-risk";
import { getOnboardingChecklist } from "@/lib/services/profile";

const COLUMNS: { key: Health; title: string }[] = [
  { key: "red", title: "Red" },
  { key: "yellow", title: "Yellow" },
  { key: "green", title: "Green" },
];

function ClientCard({
  client,
  delayScore,
}: {
  client: DerivedClient;
  delayScore?: number;
}) {
  const urgent = client.daysToLaunch > 0 && client.daysToLaunch <= 5;
  return (
    <Link
      href={`/clients/${client.id}`}
      className="block rounded-xl border border-vco-border bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:border-[#CDDBFF]"
    >
      <div className="flex items-start gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EFF4FF] text-xs font-bold text-[#1E40FF]">
          {clientInitial(client.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm font-semibold text-vco-ink">
              {client.name}
            </div>
            <HealthDot health={client.health} />
          </div>
          <div className="mt-0.5 text-xs text-vco-muted">{client.ae.name}</div>
          {delayScore != null ? (
            <div
              className={`mt-1 text-[11px] font-semibold ${
                delayScore >= 60
                  ? "text-[#B42318]"
                  : delayScore >= 35
                    ? "text-[#B54708]"
                    : "text-slate-500"
              }`}
            >
              {delayScore}% delay risk
            </div>
          ) : null}
          <div className="mt-2 text-xs font-medium text-slate-600">
            {client.phaseLabel}
          </div>
          <div className="mt-2">
            <ProgressBar
              value={client.completion}
              tone={urgent ? "red" : "blue"}
            />
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span className="font-medium text-slate-500">
                {client.completion}%
              </span>
              <span
                className={
                  urgent
                    ? "font-semibold text-[#B42318]"
                    : client.daysToLaunch < 0
                      ? "font-semibold text-[#067647]"
                      : "font-medium text-slate-500"
                }
              >
                {urgent ? `${client.launchLabel} ⚠` : client.launchLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function CommandCenterPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "ae") redirect("/ae-dashboard");

  const [kpis, byHealth, upcoming, waiting, workload, orgClients, layout, onboarding] =
    await Promise.all([
      portfolioKpis(user),
      clientsByHealth(user),
      upcomingLaunches(5, user),
      waitingSummary(user),
      aeWorkload(user),
      prisma.client.findMany({
        where: { organizationId: user.organizationId, deletedAt: null },
        include: { ae: true, tasks: true, risks: true },
      }),
      prisma.dashboardLayout.findFirst({
        where: { organizationId: user.organizationId, userId: user.id },
      }),
      getOnboardingChecklist(user),
    ]);

  let widgets = ["revenue", "tasks", "risks", "launches", "delay"];
  try {
    if (layout?.widgetsJson) widgets = JSON.parse(layout.widgetsJson);
  } catch {
    /* defaults */
  }
  const show = (id: string) => widgets.includes(id);

  const delayByClient = Object.fromEntries(
    orgClients.map((c) => {
      const overdue = c.tasks.filter((t) => t.status !== "Done").length;
      const critical = c.risks.filter(
        (r) => r.severity === "Critical" && r.status !== "Closed",
      ).length;
      return [
        c.id,
        computeDelayRisk({
          overdueTasks: overdue,
          openCriticalRisks: critical,
          aeCapacityLoad: c.ae.capacityLoad,
          waitDays: c.waitDays,
          daysToLaunch: c.daysToLaunch,
          criticalOverdue: c.criticalOverdue,
        }).score,
      ];
    }),
  );
  const delayScores = Object.values(delayByClient);
  const avgDelay = delayScores.length
    ? Math.round(delayScores.reduce((a, b) => a + b, 0) / delayScores.length)
    : 0;
  const highDelay = delayScores.filter((s) => s >= 60).length;
  const mrrSum = orgClients.reduce((s, c) => s + c.mrr, 0);
  const slaBreaches = orgClients.filter((c) => c.waitDays > 5).length;
  const orgHealth = Math.max(0, 100 - avgDelay);

  return (
    <div>
      <PageHeader
        title="Command Center"
        subtitle="Portfolio health across all active clients — status is computed, never typed."
      />

      {onboarding.show ? <WelcomeChecklist steps={onboarding.steps} /> : null}

      <WidgetToggle initial={widgets} />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Active Clients"
          value={kpis.activeClients}
          hint={`across ${kpis.aeCount} AEs`}
        />
        <KpiCard
          label="Avg Completion"
          value={`${kpis.avgCompletion}%`}
          hint="portfolio"
        />
        {show("launches") ? (
          <KpiCard
            label="Avg Days to Launch"
            value={kpis.avgDaysToLaunch}
            hint="active projects"
          />
        ) : null}
        {show("launches") ? (
          <KpiCard
            label="Projects > 60 Days"
            value={kpis.projectsOver60Days}
            hint={kpis.projectsOver60Days ? "needs CEO review" : "on track"}
            hintTone={kpis.projectsOver60Days ? "danger" : "muted"}
          />
        ) : null}
        {show("risks") ? (
          <KpiCard
            label="Open Risks"
            value={kpis.openRisks}
            hint={`${kpis.criticalRisks} critical`}
            hintTone={kpis.criticalRisks ? "danger" : "muted"}
          />
        ) : null}
        {show("tasks") ? (
          <KpiCard label="Overdue Tasks" value={kpis.overdueTasks} />
        ) : null}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {show("delay") ? (
          <KpiCard
            label="Avg delay risk"
            value={`${avgDelay}%`}
            hint={`${highDelay} clients ≥60%`}
            hintTone={highDelay ? "danger" : "muted"}
          />
        ) : null}
        {show("delay") ? (
          <KpiCard
            label="Org health score"
            value={orgHealth}
            hint="100 − avg delay"
          />
        ) : null}
        <KpiCard
          label="SLA breaches"
          value={slaBreaches}
          hint="waiting &gt; 5 days"
        />
        {show("revenue") ? (
          <KpiCard
            label="Portfolio MRR"
            value={`$${(mrrSum / 1000).toFixed(0)}k`}
            hint="sum of client MRR"
          />
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
        <section>
          <h2 className="mb-3 text-base font-semibold text-vco-ink">
            Command Center — clients by health
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.key} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <HealthPill health={col.key} />
                  <span className="text-xs font-semibold text-vco-muted">
                    {byHealth[col.key].length}
                  </span>
                </div>
                {byHealth[col.key].map((c) => (
                  <ClientCard
                    key={c.id}
                    client={c}
                    delayScore={delayByClient[c.id]}
                  />
                ))}
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-vco-border bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-vco-ink">
              Upcoming launches
            </h2>
            <ul className="space-y-2.5">
              {upcoming.map((c) => (
                <li
                  key={c.id}
                  className="flex items-baseline justify-between gap-2 text-sm"
                >
                  <span className="font-semibold text-[#2E5BFF]">
                    {c.daysToLaunch} DAYS
                  </span>
                  <span className="truncate text-right text-slate-600">
                    {c.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-vco-border bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-vco-ink">
              What we&apos;re waiting on
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-[#FFFAEB] px-3 py-3">
                <div className="text-xl font-semibold text-[#B54708]">
                  {waiting.onClient}
                </div>
                <div className="text-xs font-medium text-[#B54708]">
                  on Client
                </div>
              </div>
              <div className="rounded-lg bg-[#EFF4FF] px-3 py-3">
                <div className="text-xl font-semibold text-[#1E40FF]">
                  {waiting.onInternal}
                </div>
                <div className="text-xs font-medium text-[#1E40FF]">
                  on Internal
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-6 rounded-xl border border-vco-border bg-white">
        <div className="border-b border-vco-border px-4 py-3">
          <h2 className="text-sm font-semibold text-vco-ink">AE workload</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] tracking-wide text-slate-400 uppercase">
              <tr className="border-b border-vco-border">
                <th className="px-4 py-2.5 font-semibold">Account Executive</th>
                <th className="px-4 py-2.5 font-semibold">Active Clients</th>
                <th className="px-4 py-2.5 font-semibold">Open Tasks</th>
                <th className="px-4 py-2.5 font-semibold">Capacity Load</th>
              </tr>
            </thead>
            <tbody>
              {workload.map((row) => (
                <tr
                  key={row.ae.id}
                  className="border-b border-vco-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-vco-ink">
                    {row.ae.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.activeClients}</td>
                  <td className="px-4 py-3 text-slate-600">{row.openTasks}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <ProgressBar
                          value={row.capacityLoad}
                          tone={row.capacityLoad >= 90 ? "red" : "blue"}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">
                        {row.capacityLoad}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
