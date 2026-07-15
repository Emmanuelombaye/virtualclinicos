import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";
import { writeActivity } from "@/lib/activity";
import { z } from "zod";
import { GATE_CATALOG } from "@/lib/constants";
import { dispatchWebhooks } from "@/lib/services/webhooks";

export async function listTemplatesService(user: AuthUser) {
  requirePermission(user, "clients.view");
  return prisma.launchTemplate.findMany({
    where: { organizationId: user.organizationId },
    include: { gates: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  });
}

export const CreateFromTemplateInput = z.object({
  templateId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  aeId: z.string().min(1),
  mrr: z.number().int().min(0).optional(),
});

export async function createClientFromTemplateService(
  user: AuthUser,
  input: z.infer<typeof CreateFromTemplateInput>,
) {
  requirePermission(user, "clients.manage");
  const data = CreateFromTemplateInput.parse(input);
  const aeId = user.role === "ae" && user.aeId ? user.aeId : data.aeId;

  const template = await prisma.launchTemplate.findFirst({
    where: { id: data.templateId, organizationId: user.organizationId },
    include: { gates: { orderBy: { sortOrder: "asc" } } },
  });
  if (!template) throw new Error("Not found");

  const gateDefs =
    template.gates.length > 0
      ? template.gates
      : GATE_CATALOG.map((g, i) => ({
          name: g.name,
          phase: g.phase,
          critical: g.critical,
          ownerType: g.ownerType,
          sortOrder: i,
        }));

  const client = await prisma.client.create({
    data: {
      organizationId: user.organizationId,
      name: data.name,
      aeId,
      phase: 1,
      status: "Active",
      health: "green",
      daysToLaunch: template.daysToLaunch,
      mrr: data.mrr ?? template.defaultMrr,
      waitingOn: "Nothing",
      waitDays: 0,
      criticalOverdue: 0,
      gates: {
        create: gateDefs.map((g) => ({
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
    action: "client.create_from_template",
    entityType: "Client",
    entityId: String(client.id),
    after: { name: client.name, templateId: template.id },
  });
  await writeActivity({
    user,
    action: "client.create",
    entityType: "Client",
    entityId: String(client.id),
    clientId: client.id,
    summary: `${user.name} created client "${client.name}" from template ${template.name}`,
  });

  void dispatchWebhooks(user.organizationId, "client.created", {
    clientId: client.id,
    name: client.name,
  });

  return client;
}
