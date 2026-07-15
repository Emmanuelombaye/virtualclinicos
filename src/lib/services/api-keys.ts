import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";
import { generateApiKeyRaw } from "@/lib/auth/api-key";
import { z } from "zod";

export const CreateApiKeyInput = z.object({
  name: z.string().trim().min(1).max(80),
  scopes: z.array(z.string()).default([]),
});

export async function listApiKeysService(user: AuthUser) {
  requirePermission(user, "api_keys.manage");
  return prisma.apiKey.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopesJson: true,
      lastUsedAt: true,
      revokedAt: true,
      createdAt: true,
    },
  });
}

export async function createApiKeyService(
  user: AuthUser,
  input: z.infer<typeof CreateApiKeyInput>,
) {
  requirePermission(user, "api_keys.manage");
  const data = CreateApiKeyInput.parse(input);
  const { raw, prefix, tokenHash } = generateApiKeyRaw();
  const key = await prisma.apiKey.create({
    data: {
      organizationId: user.organizationId,
      name: data.name,
      tokenHash,
      prefix,
      scopesJson: JSON.stringify(data.scopes),
      createdById: user.id,
    },
  });
  await writeAudit({
    user,
    action: "api_key.create",
    entityType: "ApiKey",
    entityId: key.id,
    after: { name: key.name, prefix },
  });
  return { key, raw };
}

export async function revokeApiKeyService(user: AuthUser, keyId: string) {
  requirePermission(user, "api_keys.manage");
  const existing = await prisma.apiKey.findFirst({
    where: { id: keyId, organizationId: user.organizationId },
  });
  if (!existing) throw new Error("Not found");
  const key = await prisma.apiKey.update({
    where: { id: keyId },
    data: { revokedAt: new Date() },
  });
  await writeAudit({
    user,
    action: "api_key.revoke",
    entityType: "ApiKey",
    entityId: key.id,
  });
  return key;
}
