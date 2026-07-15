import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { Breadcrumbs } from "@/components/shell/Breadcrumbs";
import { ClientDetailTabs } from "@/components/views/ClientDetailTabs";
import { WaitingOnEditor } from "@/components/views/WaitingOnEditor";
import {
  AskAiPanel,
  CustomFieldsSection,
  PresenceStrip,
} from "@/components/views/ClientExtras";
import { HealthPill } from "@/components/ui/HealthPill";
import { Badge } from "@/components/ui/Badge";
import { PHASES } from "@/lib/constants";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  getClientById,
  listClientOptions,
  risksForClient,
  tasksForClient,
  commsForClient,
} from "@/lib/queries";
import { listClientActivity } from "@/lib/activity";
import { listCommentsService } from "@/lib/services/comments";
import { listFilesService } from "@/lib/services/files";
import { clientInitial } from "@/lib/ui";
import { prisma } from "@/lib/db";
import { computeDelayRisk } from "@/lib/delay-risk";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const client = await getClientById(Number(id), user);
  if (!client) notFound();

  const [risks, tasks, comms, clientOptions, activity, comments, files, overdueTasks, openCritical] =
    await Promise.all([
      risksForClient(client.id, user),
      tasksForClient(client.id, user),
      commsForClient(client.id, user),
      listClientOptions(user),
      listClientActivity(user, client.id),
      listCommentsService(user, "Client", String(client.id)),
      listFilesService(user, { clientId: client.id }),
      prisma.task.count({
        where: { clientId: client.id, deletedAt: null, status: { not: "Done" } },
      }),
      prisma.risk.count({
        where: {
          clientId: client.id,
          deletedAt: null,
          severity: "Critical",
          status: { not: "Closed" },
        },
      }),
    ]);

  const delayRisk = computeDelayRisk({
    overdueTasks,
    openCriticalRisks: openCritical,
    aeCapacityLoad: client.ae.capacityLoad,
    waitDays: client.waitDays,
    daysToLaunch: client.daysToLaunch,
    criticalOverdue: client.criticalOverdue,
  });

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Clients", href: "/clients" },
          { label: client.name },
        ]}
      />
      <PageHeader
        title={client.name}
        subtitle={client.phaseLabel}
        showNewTask
        clientOptions={clientOptions}
        defaultClientId={client.id}
        actions={
          <Link
            href="/clients"
            className="inline-flex h-9 items-center rounded-lg border border-vco-border bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            All clients
          </Link>
        }
      />

      <div className="mb-5 rounded-xl border border-vco-border bg-white p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#EFF4FF] text-lg font-bold text-[#1E40FF]">
            {clientInitial(client.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-vco-ink">{client.name}</h2>
              <HealthPill health={client.health} suffix=" health" />
              <Badge
                label={client.status === "Hypercare" ? "Active" : client.status}
              />
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  delayRisk.score >= 60
                    ? "bg-red-100 text-red-800"
                    : delayRisk.score >= 30
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {delayRisk.score}% delay risk
              </span>
            </div>
            <div className="mt-1 text-sm text-vco-muted">
              {client.ae.name} · {client.phaseLabel}
            </div>
            <PresenceStrip clientId={client.id} />
            {delayRisk.reasons.length ? (
              <p className="mt-1 text-xs text-slate-500">
                {delayRisk.reasons.join(" · ")}
              </p>
            ) : null}
          </div>
        </div>

        <WaitingOnEditor
          clientId={client.id}
          waitingOn={client.waitingOn}
          waitDays={client.waitDays}
        />

        <div className="mt-5 flex gap-1 overflow-x-auto pb-1">
          {PHASES.filter((p) => p.id <= 10).map((p) => {
            const done = client.phase > p.id || client.status === "Hypercare";
            const current =
              client.phase === p.id && client.status !== "Hypercare";
            return (
              <div
                key={p.id}
                className="flex min-w-[72px] flex-1 flex-col items-center gap-1.5"
              >
                <div
                  className={`flex size-7 items-center justify-center rounded-full text-[11px] font-bold ${
                    done
                      ? "bg-[#2E5BFF] text-white"
                      : current
                        ? "border-2 border-[#2E5BFF] bg-white text-[#2E5BFF]"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {done ? "✓" : p.id}
                </div>
                <div
                  className={`text-center text-[10px] font-medium ${
                    current ? "text-[#1E40FF]" : "text-slate-400"
                  }`}
                >
                  {p.name}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Metric label="Completion" value={`${client.completion}%`} />
          <Metric label="Open Tasks" value={client.openTaskCount} />
          <Metric label="Deliverables Left" value={client.deliverablesLeft} />
          <Metric
            label="Critical Overdue"
            value={client.criticalOverdue}
            danger={client.criticalOverdue > 0}
          />
          <Metric
            label="Delay risk"
            value={`${delayRisk.score}%`}
            danger={delayRisk.score >= 60}
          />
          <Metric
            label="Meetings"
            value={client.daysToLaunch < 0 ? 11 : 6}
          />
        </div>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <AskAiPanel clientId={client.id} />
        <CustomFieldsSection clientId={client.id} />
      </div>

      <ClientDetailTabs
        clientId={client.id}
        gates={client.gates}
        tasks={tasks}
        comms={comms}
        risks={risks}
        aeName={`${client.ae.name.split(" ")[0]}'s team`}
        activity={activity}
        comments={comments}
        files={files}
        canComment={hasPermission(user, "comments.create")}
        canUpload={hasPermission(user, "files.upload")}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  danger,
}: {
  label: string;
  value: string | number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-vco-border bg-slate-50/80 px-3 py-2.5">
      <div
        className={`text-xl font-semibold ${
          danger ? "text-[#B42318]" : "text-vco-ink"
        }`}
      >
        {value}
      </div>
      <div className="text-[11px] font-medium text-vco-muted">{label}</div>
    </div>
  );
}
