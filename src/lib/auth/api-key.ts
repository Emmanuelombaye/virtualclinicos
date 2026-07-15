import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { parsePermissions } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";
import type { Permission } from "@/lib/auth/permissions-catalog";
import { rateLimitConsume } from "@/lib/infra/rate-limit";
import { logger } from "@/lib/infra/logger";

export function hashApiKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateApiKeyRaw() {
  const prefix = `vco_${randomBytes(4).toString("hex")}`;
  const secret = randomBytes(24).toString("base64url");
  const raw = `${prefix}.${secret}`;
  return { raw, prefix, tokenHash: hashApiKey(raw) };
}

async function loadUserAsAuth(userId: string): Promise<AuthUser | null> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: { select: { name: true, primaryColor: true } },
      role: {
        include: { permissions: { select: { permission: true } } },
      },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    organizationId: row.organizationId,
    organizationName: row.organization.name,
    organizationPrimaryColor: row.organization.primaryColor,
    name: row.name,
    initials: row.initials,
    role: row.role.slug,
    roleId: row.role.id,
    roleName: row.role.name,
    permissions: parsePermissions(row.role.permissions.map((p) => p.permission)),
    aeId: row.aeId,
    email: row.email,
    impersonatorId: null,
  };
}

async function resolveApiKeyAuth(req: Request): Promise<AuthUser | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) return null;
  const raw = auth.slice(7).trim();
  if (!raw) return null;
  const tokenHash = hashApiKey(raw);
  const key = await prisma.apiKey.findFirst({
    where: { tokenHash, revokedAt: null },
    include: {
      createdBy: {
        include: {
          organization: { select: { name: true, primaryColor: true } },
          role: {
            include: { permissions: { select: { permission: true } } },
          },
        },
      },
    },
  });
  if (!key) return null;

  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  const scopes = JSON.parse(key.scopesJson || "[]") as string[];
  const rolePerms = parsePermissions(
    key.createdBy.role.permissions.map((p) => p.permission),
  );
  const scoped: Permission[] =
    scopes.length === 0
      ? rolePerms
      : (scopes.filter((s) => rolePerms.includes(s as Permission)) as Permission[]);

  return {
    id: key.createdBy.id,
    organizationId: key.organizationId,
    organizationName: key.createdBy.organization.name,
    organizationPrimaryColor: key.createdBy.organization.primaryColor,
    name: key.createdBy.name,
    initials: key.createdBy.initials,
    role: key.createdBy.role.slug,
    roleId: key.createdBy.role.id,
    roleName: key.createdBy.role.name,
    permissions: scoped,
    aeId: key.createdBy.aeId,
    email: key.createdBy.email,
    impersonatorId: null,
    apiKeyId: key.id,
  };
}

export type ResolveAuthResult = {
  user: AuthUser;
  rateLimit?: { remaining: number; limit: number };
};

/** Cookie session OR Bearer API key. */
export async function resolveAuth(req: Request): Promise<AuthUser> {
  const fromKey = await resolveApiKeyAuth(req);
  if (fromKey) return fromKey;
  const session = await getSessionUser();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function resolveAuthWithRateLimit(
  req: Request,
): Promise<ResolveAuthResult> {
  const user = await resolveAuth(req);
  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { apiRateLimitPerMinute: true },
  });
  const limit = org?.apiRateLimitPerMinute ?? 120;
  const key = user.apiKeyId
    ? `apikey:${user.apiKeyId}`
    : `org:${user.organizationId}`;
  const rl = rateLimitConsume(key, limit);
  if (!rl.allowed) {
    logger("warn", "rate_limited", { organizationId: user.organizationId });
    throw new Error("Rate limit exceeded");
  }

  // fire-and-forget usage counter
  const day = new Date().toISOString().slice(0, 10);
  const route = new URL(req.url).pathname;
  void prisma.apiUsageDaily
    .upsert({
      where: {
        organizationId_day_route: {
          organizationId: user.organizationId,
          day,
          route,
        },
      },
      create: {
        organizationId: user.organizationId,
        day,
        route,
        count: 1,
        errors: 0,
      },
      update: { count: { increment: 1 } },
    })
    .catch(() => undefined);

  return {
    user,
    rateLimit: { remaining: rl.remaining, limit: rl.limit },
  };
}

export { loadUserAsAuth };
