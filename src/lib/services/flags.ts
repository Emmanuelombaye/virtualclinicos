import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

export async function isFeatureEnabled(
  organizationId: string,
  key: string,
): Promise<boolean> {
  const orgFlag = await prisma.featureFlag.findFirst({
    where: { organizationId, key },
  });
  if (orgFlag) return orgFlag.enabled;
  const global = await prisma.featureFlag.findFirst({
    where: { organizationId: null, key },
  });
  return global?.enabled ?? false;
}

export async function listFlagsService(user: AuthUser) {
  requirePermission(user, "flags.manage");
  return prisma.featureFlag.findMany({
    where: {
      OR: [{ organizationId: user.organizationId }, { organizationId: null }],
    },
    orderBy: { key: "asc" },
  });
}

export const FlagInput = z.object({
  key: z.string().trim().min(1).max(60),
  enabled: z.boolean(),
  description: z.string().optional(),
});

export async function upsertFlagService(
  user: AuthUser,
  input: z.infer<typeof FlagInput>,
) {
  requirePermission(user, "flags.manage");
  const data = FlagInput.parse(input);
  const existing = await prisma.featureFlag.findFirst({
    where: { organizationId: user.organizationId, key: data.key },
  });
  const flag = existing
    ? await prisma.featureFlag.update({
        where: { id: existing.id },
        data: { enabled: data.enabled, description: data.description },
      })
    : await prisma.featureFlag.create({
        data: {
          organizationId: user.organizationId,
          key: data.key,
          enabled: data.enabled,
          description: data.description,
        },
      });
  await writeAudit({
    user,
    action: "flag.upsert",
    entityType: "FeatureFlag",
    entityId: flag.id,
    after: { key: flag.key, enabled: flag.enabled },
  });
  return flag;
}
