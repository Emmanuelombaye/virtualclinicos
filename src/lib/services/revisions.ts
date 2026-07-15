import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/auth/users";

export class VersionConflictError extends Error {
  constructor(message = "Version conflict") {
    super(message);
    this.name = "VersionConflictError";
  }
}

type ModelName = "client" | "task" | "risk" | "clientGate";

/**
 * Optimistic lock: update only if version matches, then increment.
 */
export async function updateWithVersion<T>(
  model: ModelName,
  id: string | number,
  expectedVersion: number,
  data: Record<string, unknown>,
): Promise<T> {
  const delegate = (prisma as unknown as Record<string, {
    updateMany: (args: unknown) => Promise<{ count: number }>;
    findUnique: (args: unknown) => Promise<T | null>;
  }>)[model];

  const result = await delegate.updateMany({
    where: { id, version: expectedVersion },
    data: { ...data, version: expectedVersion + 1 },
  });

  if (result.count === 0) {
    throw new VersionConflictError();
  }

  const row = await delegate.findUnique({ where: { id } });
  if (!row) throw new Error("Not found");
  return row;
}

export async function writeRevision(input: {
  user: AuthUser;
  entityType: string;
  entityId: string;
  version: number;
  snapshot: unknown;
}) {
  await prisma.entityRevision.create({
    data: {
      organizationId: input.user.organizationId,
      entityType: input.entityType,
      entityId: input.entityId,
      version: input.version,
      snapshotJson: JSON.stringify(input.snapshot),
      actorId: input.user.id,
    },
  });

  const old = await prisma.entityRevision.findMany({
    where: {
      organizationId: input.user.organizationId,
      entityType: input.entityType,
      entityId: input.entityId,
    },
    orderBy: { createdAt: "desc" },
    skip: 20,
    select: { id: true },
  });
  if (old.length) {
    await prisma.entityRevision.deleteMany({
      where: { id: { in: old.map((o) => o.id) } },
    });
  }
}
