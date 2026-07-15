import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { parsePermissions } from "./permissions";
import type { AuthUser } from "./users";

const COOKIE = "vco_session";
const IDLE_MS = 8 * 60 * 60 * 1000;
const TOUCH_MS = 5 * 60 * 1000;

function secretKey() {
  const secret = process.env.AUTH_SECRET ?? "vco-dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  sub: string;
  impersonatorId?: string;
};

export async function createSession(
  userId: string,
  opts?: { impersonatorId?: string },
) {
  const payload: SessionPayload = { sub: userId };
  if (opts?.impersonatorId) payload.impersonatorId = opts.impersonatorId;

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  await prisma.user.update({
    where: { id: userId },
    data: { lastActiveAt: new Date() },
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

function toAuthUser(
  row: {
    id: string;
    organizationId: string;
    email: string;
    name: string;
    initials: string;
    aeId: string | null;
    roleId: string;
    organization: { name: string; primaryColor: string | null };
    role: {
      id: string;
      name: string;
      slug: string;
      permissions: { permission: string }[];
    };
  },
  impersonatorId?: string | null,
): AuthUser {
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
    impersonatorId: impersonatorId ?? null,
  };
}

const userInclude = {
  organization: { select: { name: true, primaryColor: true } },
  role: {
    include: { permissions: { select: { permission: true } } },
  },
} as const;

export async function getSessionUser(): Promise<AuthUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    if (!sub) return null;
    const impersonatorId =
      typeof payload.impersonatorId === "string"
        ? payload.impersonatorId
        : null;

    const row = await prisma.user.findUnique({
      where: { id: sub },
      include: userInclude,
    });
    if (!row) return null;

    const activeId = impersonatorId ?? row.id;
    const lastUser = impersonatorId
      ? await prisma.user.findUnique({ where: { id: impersonatorId } })
      : row;
    const last = lastUser?.lastActiveAt?.getTime() ?? null;
    if (last != null && Date.now() - last > IDLE_MS) {
      await destroySession();
      return null;
    }

    const user = toAuthUser(row, impersonatorId);

    if (last == null || Date.now() - last > TOUCH_MS) {
      await prisma.user.update({
        where: { id: activeId },
        data: { lastActiveAt: new Date() },
      });
    }

    return user;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export { canAccessClient } from "./permissions";
