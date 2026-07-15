import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";
import { writeActivity } from "@/lib/activity";
import { createNotification } from "@/lib/services/notifications";
import { z } from "zod";

export const AutomationInput = z.object({
  name: z.string().trim().min(1).max(120),
  trigger: z.enum(["gate.complete", "task.created", "risk.critical"]),
  conditionsJson: z.string().default("{}"),
  actionsJson: z.string().min(2),
  enabled: z.boolean().optional(),
});

export async function listAutomationsService(user: AuthUser) {
  requirePermission(user, "automations.manage");
  return prisma.automationRule.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAutomationService(
  user: AuthUser,
  input: z.infer<typeof AutomationInput>,
) {
  requirePermission(user, "automations.manage");
  const data = AutomationInput.parse(input);
  const rule = await prisma.automationRule.create({
    data: {
      organizationId: user.organizationId,
      name: data.name,
      trigger: data.trigger,
      conditionsJson: data.conditionsJson,
      actionsJson: data.actionsJson,
      enabled: data.enabled ?? true,
    },
  });
  await writeAudit({
    user,
    action: "automation.create",
    entityType: "AutomationRule",
    entityId: rule.id,
    after: { name: rule.name, trigger: rule.trigger },
  });
  return rule;
}

export async function setAutomationEnabledService(
  user: AuthUser,
  ruleId: string,
  enabled: boolean,
) {
  requirePermission(user, "automations.manage");
  const rule = await prisma.automationRule.findFirst({
    where: { id: ruleId, organizationId: user.organizationId },
  });
  if (!rule) throw new Error("Not found");
  return prisma.automationRule.update({
    where: { id: ruleId },
    data: { enabled },
  });
}

type Action =
  | { type: "create_task"; title: string; priority?: string; owner?: string }
  | { type: "notify"; roleSlugs?: string[]; title: string; body: string }
  | { type: "activity"; summary: string };

export async function runAutomations(input: {
  organizationId: string;
  trigger: string;
  clientId?: number;
  actor?: AuthUser | null;
  context?: Record<string, unknown>;
}) {
  const rules = await prisma.automationRule.findMany({
    where: {
      organizationId: input.organizationId,
      trigger: input.trigger,
      enabled: true,
    },
  });

  for (const rule of rules) {
    let actions: Action[] = [];
    try {
      actions = JSON.parse(rule.actionsJson) as Action[];
    } catch {
      continue;
    }

    for (const action of actions) {
      if (action.type === "create_task" && input.clientId) {
        await prisma.task.create({
          data: {
            organizationId: input.organizationId,
            clientId: input.clientId,
            title: action.title,
            priority: action.priority ?? "Medium",
            owner: action.owner ?? "System",
            due: "TBD",
            status: "To Do",
          },
        });
      }
      if (action.type === "notify") {
        const users = await prisma.user.findMany({
          where: {
            organizationId: input.organizationId,
            ...(action.roleSlugs?.length
              ? { role: { slug: { in: action.roleSlugs } } }
              : {}),
          },
        });
        for (const u of users) {
          await createNotification({
            organizationId: input.organizationId,
            userId: u.id,
            type: "automation",
            title: action.title,
            body: action.body,
            href: input.clientId ? `/clients/${input.clientId}` : undefined,
          });
        }
      }
      if (action.type === "activity" && input.actor) {
        await writeActivity({
          user: input.actor,
          action: "automation.run",
          entityType: "AutomationRule",
          entityId: rule.id,
          clientId: input.clientId,
          summary: action.summary,
        });
      }
    }
  }
}
