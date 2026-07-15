import { prisma } from "@/lib/db";
import {
  canAccessClient,
  clientVisibilityWhere,
  orgScope,
  requirePermission,
} from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";
import { writeActivity } from "@/lib/activity";
import { GATE_CATALOG } from "@/lib/constants";
import { computeHealth } from "@/lib/status-engine";
import type { Client, WaitingOn } from "@/lib/types";
import { z } from "zod";

export async function assertClientAccess(user: AuthUser, clientId: number) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      organizationId: user.organizationId,
      deletedAt: null,
    },
  });
  if (!client || !canAccessClient(user, client.aeId)) {
    throw new Error("Forbidden");
  }
  return client;
}

export async function refreshClientHealth(clientId: number) {
  const row = await prisma.client.findUnique({ where: { id: clientId } });
  if (!row || row.deletedAt) return;

  const asClient: Client = {
    id: row.id,
    name: row.name,
    aeId: row.aeId as Client["aeId"],
    phase: row.phase as Client["phase"],
    status: row.status as Client["status"],
    health: row.health as Client["health"],
    daysToLaunch: row.daysToLaunch,
    mrr: row.mrr,
    waitingOn: row.waitingOn as WaitingOn,
    waitDays: row.waitDays,
    criticalOverdue: row.criticalOverdue,
  };

  const health = computeHealth(asClient);
  if (health !== row.health) {
    await prisma.client.update({
      where: { id: clientId },
      data: { health },
    });
  }
}

export const CreateClientInput = z.object({
  name: z.string().trim().min(2).max(120),
  aeId: z.enum(["maya", "devon", "priya"]),
  mrr: z.number().int().min(0).max(1_000_000).optional(),
});

export async function createClientService(
  user: AuthUser,
  input: z.infer<typeof CreateClientInput>,
) {
  requirePermission(user, "clients.manage");
  const data = CreateClientInput.parse(input);
  const aeId = user.role === "ae" && user.aeId ? user.aeId : data.aeId;

  const client = await prisma.client.create({
    data: {
      organizationId: user.organizationId,
      name: data.name,
      aeId,
      phase: 1,
      status: "Active",
      health: "green",
      daysToLaunch: 90,
      mrr: data.mrr ?? 0,
      waitingOn: "Nothing",
      waitDays: 0,
      criticalOverdue: 0,
      gates: {
        create: GATE_CATALOG.map((g) => ({
          organizationId: user.organizationId,
          name: g.name,
          phase: g.phase,
          critical: g.critical,
          ownerType: g.ownerType,
          status: g.phase === 1 ? "In Progress" : "Not Started",
        })),
      },
    },
  });

  await writeAudit({
    user,
    action: "client.create",
    entityType: "Client",
    entityId: String(client.id),
    after: { name: client.name, aeId: client.aeId },
  });
  await writeActivity({
    user,
    action: "client.create",
    entityType: "Client",
    entityId: String(client.id),
    clientId: client.id,
    summary: `${user.name} created client ${client.name}`,
  });

  const { dispatchWebhooks } = await import("@/lib/services/webhooks");
  void dispatchWebhooks(user.organizationId, "client.created", {
    clientId: client.id,
    name: client.name,
  });

  return client;
}

export const WaitingOnSchema = z.enum(["Nothing", "Client", "Internal"]);

export async function updateClientWaitingService(
  user: AuthUser,
  input: {
    clientId: number;
    waitingOn: z.infer<typeof WaitingOnSchema>;
    waitDays: number;
  },
) {
  requirePermission(user, "clients.manage");
  const waitingOn = WaitingOnSchema.parse(input.waitingOn);
  const waitDays = z.number().int().min(0).max(365).parse(input.waitDays);
  const before = await assertClientAccess(user, input.clientId);

  const client = await prisma.client.update({
    where: { id: input.clientId },
    data: { waitingOn, waitDays },
  });
  await refreshClientHealth(client.id);

  await writeAudit({
    user,
    action: "client.waiting",
    entityType: "Client",
    entityId: String(client.id),
    before: { waitingOn: before.waitingOn, waitDays: before.waitDays },
    after: { waitingOn, waitDays },
  });
  await writeActivity({
    user,
    action: "client.waiting",
    entityType: "Client",
    entityId: String(client.id),
    clientId: client.id,
    summary: `${user.name} set waiting on to ${waitingOn}`,
  });

  return client;
}

export async function softDeleteClientService(user: AuthUser, clientId: number) {
  requirePermission(user, "clients.delete");
  await assertClientAccess(user, clientId);

  const client = await prisma.client.update({
    where: { id: clientId },
    data: { deletedAt: new Date() },
  });

  await writeAudit({
    user,
    action: "client.soft_delete",
    entityType: "Client",
    entityId: String(clientId),
    after: { deletedAt: client.deletedAt },
  });
  await writeActivity({
    user,
    action: "client.soft_delete",
    entityType: "Client",
    entityId: String(clientId),
    clientId,
    summary: `${user.name} archived client ${client.name}`,
  });

  return client;
}

export async function listClientsService(user: AuthUser) {
  requirePermission(user, "clients.view");
  return prisma.client.findMany({
    where: clientVisibilityWhere(user),
    include: {
      ae: true,
      gates: { orderBy: [{ phase: "asc" }, { name: "asc" }] },
      tasks: { select: { status: true } },
    },
    orderBy: { id: "asc" },
  });
}

export async function getClientService(user: AuthUser, id: number) {
  requirePermission(user, "clients.view");
  const row = await prisma.client.findFirst({
    where: { id, ...clientVisibilityWhere(user) },
    include: {
      ae: true,
      gates: { orderBy: [{ phase: "asc" }, { name: "asc" }] },
      tasks: { select: { status: true } },
    },
  });
  return row;
}

export { orgScope };
