import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/auth/users";

export async function writeActivity(input: {
  user: AuthUser;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  clientId?: number | null;
  metadata?: unknown;
}) {
  await prisma.activityEvent.create({
    data: {
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      clientId: input.clientId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      summary: input.summary,
      metadataJson:
        input.metadata != null ? JSON.stringify(input.metadata) : null,
    },
  });
}

export async function listClientActivity(
  user: AuthUser,
  clientId: number,
  limit = 50,
) {
  return prisma.activityEvent.findMany({
    where: {
      organizationId: user.organizationId,
      clientId,
    },
    include: {
      actor: { select: { name: true, initials: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
