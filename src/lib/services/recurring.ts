import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

export const RecurringRuleInput = z.object({
  clientId: z.number().int().positive().optional().nullable(),
  title: z.string().trim().min(3).max(200),
  priority: z.enum(["Urgent", "High", "Medium", "Low"]).default("Medium"),
  owner: z.string().trim().min(1).max(80),
  cadence: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
});

function nextFromCadence(cadence: string, from = new Date()): Date {
  const d = new Date(from);
  switch (cadence) {
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
}

export async function createRecurringRuleService(
  user: AuthUser,
  input: z.infer<typeof RecurringRuleInput>,
) {
  requirePermission(user, "tasks.manage");
  const data = RecurringRuleInput.parse(input);
  const rule = await prisma.recurringTaskRule.create({
    data: {
      organizationId: user.organizationId,
      clientId: data.clientId ?? null,
      title: data.title,
      priority: data.priority,
      owner: data.owner,
      cadence: data.cadence,
      nextRunAt: nextFromCadence(data.cadence),
      enabled: true,
    },
  });
  await writeAudit({
    user,
    action: "recurring.create",
    entityType: "RecurringTaskRule",
    entityId: rule.id,
    after: { title: rule.title, cadence: rule.cadence },
  });
  return rule;
}

export async function listRecurringRulesService(user: AuthUser) {
  return prisma.recurringTaskRule.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
  });
}

/** Expand due rules into Task rows (system / job). */
export async function expandDueRecurringTasks(organizationId?: string) {
  const now = new Date();
  const due = await prisma.recurringTaskRule.findMany({
    where: {
      enabled: true,
      nextRunAt: { lte: now },
      ...(organizationId ? { organizationId } : {}),
    },
  });

  let created = 0;
  for (const rule of due) {
    let clientId = rule.clientId;
    if (!clientId) {
      const first = await prisma.client.findFirst({
        where: { organizationId: rule.organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!first) continue;
      clientId = first.id;
    }

    await prisma.task.create({
      data: {
        organizationId: rule.organizationId,
        clientId,
        title: rule.title,
        priority: rule.priority,
        owner: rule.owner,
        due: now.toISOString().slice(0, 10),
        status: "To Do",
      },
    });
    await prisma.recurringTaskRule.update({
      where: { id: rule.id },
      data: {
        lastRunAt: now,
        nextRunAt: nextFromCadence(rule.cadence, now),
      },
    });
    created += 1;
  }
  return { created };
}
