import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/auth/users";

export async function writeAudit(input: {
  user: AuthUser;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      impersonatorId: input.user.impersonatorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      beforeJson: input.before != null ? JSON.stringify(input.before) : null,
      afterJson: input.after != null ? JSON.stringify(input.after) : null,
      ip: input.ip ?? null,
    },
  });
}

export async function listAuditLogs(
  user: AuthUser,
  opts?: { entityType?: string; limit?: number },
) {
  return prisma.auditLog.findMany({
    where: {
      organizationId: user.organizationId,
      ...(opts?.entityType ? { entityType: opts.entityType } : {}),
    },
    include: {
      actor: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 100,
  });
}
