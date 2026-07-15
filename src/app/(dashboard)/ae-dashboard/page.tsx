import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { HealthPill } from "@/components/ui/HealthPill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { AePicker } from "@/components/views/AePicker";
import { getSessionUser } from "@/lib/auth/session";
import {
  atRiskGatesForAe,
  followUpsForAe,
  getAe,
  getAllClients,
} from "@/lib/queries";
import type { AeId } from "@/lib/types";
import { clientInitial } from "@/lib/ui";
import { getWorkloadService } from "@/lib/services/workload";

const AE_IDS: AeId[] = ["maya", "devon", "priya"];

export default async function AeDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ae?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const requested = sp.ae as AeId | undefined;
  const aeId: AeId =
    user.role === "ae" && user.aeId
      ? (user.aeId as AeId)
      : requested && AE_IDS.includes(requested)
        ? requested
        : "maya";

  const [ae, allClients, followUps, atRisk] = await Promise.all([
    getAe(aeId, user),
    getAllClients(user),
    followUpsForAe(aeId, user),
    atRiskGatesForAe(aeId, user),
  ]);

  if (!ae) {
    return (
      <PageHeader
        title="AE Dashboard"
        subtitle="AE not found"
        showNewClient={false}
      />
    );
  }

  const clients =
    user.role === "ae"
      ? allClients
      : allClients.filter((c) => c.aeId === aeId);

  const workload = await getWorkloadService(user);
  const me = workload.find((w) => w.aeId === aeId);

  return (
    <div>
      <PageHeader
        title="AE Dashboard"
        subtitle={`${ae.name} · ${clients.length} clients${
          me ? ` · ${me.status} (${me.capacityLoad}% / ${me.openTasks} open tasks)` : ""
        }`}
        actions={
          <Suspense fallback={null}>
            <AePicker
              selectedId={aeId}
              canSwitch={user.role === "ceo" || user.role === "superadmin"}
            />
          </Suspense>
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          title="No clients on this book"
          body="Assign or create a client to see AE workload here."
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
          <section>
            <h2 className="mb-3 text-base font-semibold text-vco-ink">
              My clients — {ae.name}
            </h2>
            <div className="space-y-3">
              {clients.map((c) => {
                const urgent = c.daysToLaunch > 0 && c.daysToLaunch <= 5;
                return (
                  <Link
                    key={c.id}
                    href={`/clients/${c.id}`}
                    className="flex flex-col gap-3 rounded-xl border border-vco-border bg-white p-4 hover:border-[#CDDBFF] sm:flex-row sm:items-center"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#EFF4FF] text-sm font-bold text-[#1E40FF]">
                      {clientInitial(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold text-vco-ink">{c.name}</div>
                        <HealthPill health={c.health} />
                      </div>
                      <div className="mt-1 text-xs text-vco-muted">
                        {c.phaseLabel}
                      </div>
                      <div className="mt-2 max-w-md">
                        <ProgressBar
                          value={c.completion}
                          tone={urgent ? "red" : "blue"}
                        />
                      </div>
                    </div>
                    <div
                      className={`shrink-0 text-sm font-semibold ${
                        urgent
                          ? "text-[#B42318]"
                          : c.daysToLaunch < 0
                            ? "text-[#067647]"
                            : "text-slate-500"
                      }`}
                    >
                      {urgent ? `${c.launchLabel} !` : c.launchLabel}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border border-vco-border bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-vco-ink">
                Follow-ups due
              </h2>
              {followUps.length === 0 ? (
                <p className="text-sm text-vco-muted">No follow-ups due</p>
              ) : (
                <ul className="space-y-3">
                  {followUps.map((f) => (
                    <li key={f.id} className="flex gap-2 text-sm">
                      <span
                        className="mt-1.5 size-2 shrink-0 rounded-full"
                        style={{
                          background:
                            f.tone === "urgent"
                              ? "#EF4444"
                              : f.tone === "warn"
                                ? "#F59E0B"
                                : "#16A34A",
                        }}
                      />
                      <div>
                        <div className="font-medium text-vco-ink">
                          {f.clientName} — {f.note}
                        </div>
                        <div className="text-xs text-vco-muted">{f.due}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-vco-border bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-vco-ink">
                At-risk deliverables
              </h2>
              <ul className="space-y-2.5">
                {atRisk.map((item, i) => (
                  <li key={`${item.gate}-${i}`} className="text-sm">
                    <span className="font-medium text-vco-ink">{item.gate}</span>
                    <span className="text-vco-muted">
                      {" "}
                      — {item.clientName} · {item.phase}
                    </span>
                  </li>
                ))}
                {atRisk.length === 0 ? (
                  <li className="text-sm text-vco-muted">None right now</li>
                ) : null}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
