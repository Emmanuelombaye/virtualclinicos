import { prisma } from "./db";
import {
  mapClient,
  mapComm,
  mapFollowUp,
  mapRisk,
  mapTask,
} from "./mappers";
import { PHASES } from "./constants";
import type { AeId, DerivedClient, Health, TaskStatus } from "./types";
import type { AuthUser } from "./auth/users";
import { clientVisibilityWhere } from "./auth/permissions";

const clientInclude = {
  ae: true,
  gates: { orderBy: [{ phase: "asc" as const }, { name: "asc" as const }] },
  tasks: { select: { status: true } },
};

export async function getAllClients(
  user?: AuthUser | null,
): Promise<DerivedClient[]> {
  if (!user) return [];
  const rows = await prisma.client.findMany({
    where: clientVisibilityWhere(user),
    include: clientInclude,
    orderBy: { id: "asc" },
  });
  return rows.map(mapClient);
}

export async function getClientById(
  id: number,
  user?: AuthUser | null,
): Promise<DerivedClient | undefined> {
  if (!user) return undefined;
  const row = await prisma.client.findFirst({
    where: { id, ...clientVisibilityWhere(user) },
    include: clientInclude,
  });
  return row ? mapClient(row) : undefined;
}

export async function clientsByHealth(
  user?: AuthUser | null,
): Promise<Record<Health, DerivedClient[]>> {
  const all = await getAllClients(user);
  return {
    red: all.filter((c) => c.health === "red"),
    yellow: all.filter((c) => c.health === "yellow"),
    green: all.filter((c) => c.health === "green"),
  };
}

export async function portfolioKpis(user?: AuthUser | null) {
  const clients = await getAllClients(user);
  const clientIds = clients.map((c) => c.id);
  const orgId = user?.organizationId;
  const tasks = await prisma.task.findMany({
    where:
      clientIds.length && orgId
        ? { organizationId: orgId, clientId: { in: clientIds } }
        : { id: "__none__" },
  });
  const risks = await prisma.risk.findMany({
    where:
      clientIds.length && orgId
        ? { organizationId: orgId, clientId: { in: clientIds } }
        : { id: "__none__" },
  });

  const active = clients.filter((c) => c.status === "Active");
  const avgCompletion =
    clients.length === 0
      ? 0
      : Math.round(
          clients.reduce((s, c) => s + c.completion, 0) / clients.length,
        );
  const activeLaunches = active.filter((c) => c.daysToLaunch > 0);
  const avgDays =
    activeLaunches.length === 0
      ? 0
      : Math.round(
          activeLaunches.reduce((s, c) => s + c.daysToLaunch, 0) /
            activeLaunches.length,
        );
  const over60 = clients.filter((c) => c.daysToLaunch >= 60).length;
  const openRisks = risks.filter((r) => r.status !== "Closed");
  const criticalRisks = openRisks.filter((r) => r.severity === "Critical")
    .length;
  const overdueTasks = tasks.filter((t) => t.due.startsWith("Overdue")).length;
  const aeCount = new Set(clients.map((c) => c.aeId)).size;

  return {
    activeClients: active.length,
    aeCount,
    avgCompletion,
    avgDaysToLaunch: avgDays,
    projectsOver60Days: over60,
    openRisks: openRisks.length,
    criticalRisks,
    overdueTasks,
  };
}

export async function upcomingLaunches(limit = 5, user?: AuthUser | null) {
  return (await getAllClients(user))
    .filter((c) => c.daysToLaunch > 0)
    .sort((a, b) => a.daysToLaunch - b.daysToLaunch)
    .slice(0, limit);
}

export async function waitingSummary(user?: AuthUser | null) {
  const clients = (await getAllClients(user)).filter(
    (c) => c.waitingOn !== "Nothing",
  );
  return {
    onClient: clients.filter((c) => c.waitingOn === "Client").length,
    onInternal: clients.filter((c) => c.waitingOn === "Internal").length,
  };
}

export async function aeWorkload(user?: AuthUser | null) {
  if (!user) return [];
  const aes = await prisma.accountExecutive.findMany({
    where: {
      organizationId: user.organizationId,
      ...(user.role === "ae" && user.aeId ? { id: user.aeId } : {}),
    },
    orderBy: { name: "asc" },
  });
  const clients = await getAllClients(user);
  const tasks = await prisma.task.findMany({
    where: {
      organizationId: user.organizationId,
      clientId: { in: clients.map((c) => c.id) },
    },
  });

  return aes.map((ae) => {
    const aeClients = clients.filter((c) => c.aeId === ae.id);
    const openTasks = tasks.filter(
      (t) =>
        t.status !== "Done" && aeClients.some((c) => c.id === t.clientId),
    ).length;
    return {
      ae: {
        id: ae.id as AeId,
        name: ae.name,
        initials: ae.initials,
        capacityLoad: ae.capacityLoad,
      },
      activeClients: aeClients.length,
      openTasks,
      capacityLoad: ae.capacityLoad,
    };
  });
}

export async function projectsByPhase(user?: AuthUser | null) {
  const clients = await getAllClients(user);
  return PHASES.map((phase) => ({
    phase,
    clients: clients.filter((c) => c.phase === phase.id),
  }));
}

export async function tasksByStatus(user?: AuthUser | null) {
  if (!user) {
    const statuses: TaskStatus[] = [
      "To Do",
      "In Progress",
      "Blocked",
      "In Review",
      "Done",
    ];
    return Object.fromEntries(statuses.map((s) => [s, []])) as unknown as Record<
      TaskStatus,
      ReturnType<typeof mapTask>[]
    >;
  }
  const tasks = (
    await prisma.task.findMany({
      where: {
        organizationId: user.organizationId,
        client: {
          deletedAt: null,
          ...(user.role === "ae" && user.aeId ? { aeId: user.aeId } : {}),
        },
      },
      orderBy: { updatedAt: "desc" },
    })
  ).map(mapTask);
  const statuses: TaskStatus[] = [
    "To Do",
    "In Progress",
    "Blocked",
    "In Review",
    "Done",
  ];
  return Object.fromEntries(
    statuses.map((s) => [s, tasks.filter((t) => t.status === s)]),
  ) as Record<TaskStatus, ReturnType<typeof mapTask>[]>;
}

export async function clientName(id: number, user?: AuthUser | null) {
  const row = await prisma.client.findFirst({
    where: {
      id,
      deletedAt: null,
      ...(user ? { organizationId: user.organizationId } : {}),
    },
    select: { name: true },
  });
  return row?.name ?? "Unknown";
}

export async function risksForClient(clientId: number, user?: AuthUser | null) {
  return (
    await prisma.risk.findMany({
      where: {
        clientId,
        ...(user ? { organizationId: user.organizationId } : {}),
      },
      orderBy: { updatedAt: "desc" },
    })
  ).map(mapRisk);
}

export async function tasksForClient(clientId: number, user?: AuthUser | null) {
  return (
    await prisma.task.findMany({
      where: {
        clientId,
        ...(user ? { organizationId: user.organizationId } : {}),
      },
      orderBy: { updatedAt: "desc" },
    })
  ).map(mapTask);
}

export async function commsForClient(clientId: number, user?: AuthUser | null) {
  return (
    await prisma.comm.findMany({
      where: {
        clientId,
        ...(user ? { organizationId: user.organizationId } : {}),
      },
      orderBy: { createdAt: "desc" },
    })
  ).map(mapComm);
}

export async function followUpsForAe(aeId: AeId, user?: AuthUser | null) {
  if (!user) return [];
  const clientIds = await prisma.client.findMany({
    where: {
      aeId,
      organizationId: user.organizationId,
      deletedAt: null,
    },
    select: { id: true, name: true },
  });
  const idSet = new Set(clientIds.map((c) => c.id));
  const nameById = Object.fromEntries(clientIds.map((c) => [c.id, c.name]));
  const rows = await prisma.followUp.findMany({
    where: { organizationId: user.organizationId },
  });
  return rows
    .filter((f) => idSet.has(f.clientId))
    .map((f) => ({
      ...mapFollowUp(f),
      clientName: nameById[f.clientId] ?? "Unknown",
    }));
}

export async function atRiskGatesForAe(aeId: AeId, user?: AuthUser | null) {
  const clients = (await getAllClients(user)).filter((c) => c.aeId === aeId);
  return clients.flatMap((c) =>
    c.gates
      .filter((g) => g.critical && g.status !== "Complete")
      .map((g) => ({
        clientName: c.name,
        gate: g.name,
        phase: `P${g.phase}`,
        status: g.status,
      })),
  );
}

export async function deliverableStats(client: DerivedClient) {
  const complete = client.gates.filter((g) => g.status === "Complete").length;
  const inFlight = client.gates.filter((g) => g.status === "In Progress")
    .length;
  const notStarted = client.gates.filter((g) => g.status === "Not Started")
    .length;
  return {
    complete,
    inFlight,
    notStarted,
    criticalLeft: client.criticalLeft,
  };
}

export async function listClientOptions(user?: AuthUser | null) {
  if (!user) return [];
  return prisma.client.findMany({
    where: clientVisibilityWhere(user),
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getAe(aeId: AeId, user?: AuthUser | null) {
  if (!user) return null;
  const ae = await prisma.accountExecutive.findUnique({
    where: {
      organizationId_id: {
        organizationId: user.organizationId,
        id: aeId,
      },
    },
  });
  if (!ae) return null;
  return {
    id: ae.id as AeId,
    name: ae.name,
    initials: ae.initials,
    capacityLoad: ae.capacityLoad,
  };
}
