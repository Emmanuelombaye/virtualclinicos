import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";
import { writeActivity } from "@/lib/activity";
import { createNotification } from "@/lib/services/notifications";
import { z } from "zod";
import { assertClientAccess } from "@/lib/services/clients";
import { runAutomations } from "@/lib/services/automations";
import { dispatchWebhooks } from "@/lib/services/webhooks";
import { updateWithVersion, writeRevision } from "@/lib/services/revisions";

export const TaskStatusSchema = z.enum([
  "To Do",
  "In Progress",
  "Blocked",
  "In Review",
  "Done",
]);

export const CreateTaskInput = z.object({
  clientId: z.number().int().positive(),
  title: z.string().trim().min(3).max(200),
  priority: z.enum(["Urgent", "High", "Medium", "Low"]),
  owner: z.string().trim().min(1).max(80),
  due: z.string().trim().min(1).max(40),
});

export async function updateTaskStatusService(
  user: AuthUser,
  input: {
    taskId: string;
    status: z.infer<typeof TaskStatusSchema>;
    version?: number;
  },
) {
  requirePermission(user, "tasks.manage");
  const status = TaskStatusSchema.parse(input.status);

  const existing = await prisma.task.findFirst({
    where: {
      id: input.taskId,
      organizationId: user.organizationId,
      deletedAt: null,
    },
  });
  if (!existing) throw new Error("Not found");
  await assertClientAccess(user, existing.clientId);

  const expected = input.version ?? existing.version;
  const task = await updateWithVersion<typeof existing>(
    "task",
    input.taskId,
    expected,
    { status },
  );

  await writeRevision({
    user,
    entityType: "Task",
    entityId: task.id,
    version: task.version,
    snapshot: task,
  });

  await writeAudit({
    user,
    action: "task.status",
    entityType: "Task",
    entityId: task.id,
    before: { status: existing.status },
    after: { status },
  });
  await writeActivity({
    user,
    action: "task.status",
    entityType: "Task",
    entityId: task.id,
    clientId: task.clientId,
    summary: `${user.name} moved task "${task.title}" to ${status}`,
  });

  return task;
}

export async function createTaskService(
  user: AuthUser,
  input: z.infer<typeof CreateTaskInput>,
) {
  requirePermission(user, "tasks.manage");
  const data = CreateTaskInput.parse(input);
  await assertClientAccess(user, data.clientId);

  const task = await prisma.task.create({
    data: {
      organizationId: user.organizationId,
      clientId: data.clientId,
      title: data.title,
      priority: data.priority,
      owner: data.owner,
      due: data.due,
      status: "To Do",
    },
  });

  await writeAudit({
    user,
    action: "task.create",
    entityType: "Task",
    entityId: task.id,
    after: {
      title: task.title,
      clientId: task.clientId,
      status: task.status,
    },
  });
  await writeActivity({
    user,
    action: "task.create",
    entityType: "Task",
    entityId: task.id,
    clientId: task.clientId,
    summary: `${user.name} created task "${task.title}"`,
  });

  // Notify AE-matching user by owner name if possible
  const assignee = await prisma.user.findFirst({
    where: {
      organizationId: user.organizationId,
      OR: [
        { name: { equals: data.owner } },
        { email: { contains: data.owner.split(" ")[0] ?? data.owner } },
      ],
    },
  });
  if (assignee && assignee.id !== user.id) {
    await createNotification({
      organizationId: user.organizationId,
      userId: assignee.id,
      type: "task.assigned",
      title: "Task assigned",
      body: `${user.name} created "${task.title}" for you`,
      href: `/clients/${task.clientId}`,
      emailTo: assignee.email,
      sendEmail: true,
    });
  }

  void runAutomations({
    organizationId: user.organizationId,
    trigger: "task.created",
    clientId: task.clientId,
    actor: user,
    context: { taskId: task.id },
  });
  void dispatchWebhooks(user.organizationId, "task.created", {
    taskId: task.id,
    clientId: task.clientId,
    title: task.title,
  });

  return task;
}

export async function bulkTasksService(
  user: AuthUser,
  input: {
    ids: string[];
    action: "assign" | "status" | "delete";
    status?: string;
    owner?: string;
  },
) {
  requirePermission(user, "tasks.manage");
  const ids = z.array(z.string()).min(1).parse(input.ids);
  const tasks = await prisma.task.findMany({
    where: {
      id: { in: ids },
      organizationId: user.organizationId,
      deletedAt: null,
    },
  });
  for (const t of tasks) await assertClientAccess(user, t.clientId);

  if (input.action === "status") {
    const status = TaskStatusSchema.parse(input.status);
    await prisma.task.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
  } else if (input.action === "assign") {
    const owner = z.string().trim().min(1).parse(input.owner);
    await prisma.task.updateMany({
      where: { id: { in: ids } },
      data: { owner },
    });
  } else if (input.action === "delete") {
    await prisma.task.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date(), deletedById: user.id },
    });
  }

  await writeAudit({
    user,
    action: `task.bulk_${input.action}`,
    entityType: "Task",
    entityId: ids.join(","),
    after: { count: ids.length, action: input.action },
  });
  return { updated: ids.length };
}

export async function listTasksService(user: AuthUser) {
  return prisma.task.findMany({
    where: {
      organizationId: user.organizationId,
      deletedAt: null,
      client: {
        deletedAt: null,
        ...(user.role === "ae" && user.aeId ? { aeId: user.aeId } : {}),
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}
