import type { Permission } from "./permissions-catalog";
import { isPermission } from "./permissions-catalog";
import type { AuthUser, RoleSlug } from "./users";

const ORG_WIDE_SLUGS: RoleSlug[] = ["superadmin", "ceo", "viewer"];

export function hasPermission(user: AuthUser, permission: Permission): boolean {
  return user.permissions.includes(permission);
}

export function requirePermission(user: AuthUser, permission: Permission) {
  if (!hasPermission(user, permission)) {
    throw new Error("Forbidden");
  }
}

/** Any of the listed permissions grants access */
export function requireAnyPermission(
  user: AuthUser,
  permissions: Permission[],
) {
  if (!permissions.some((p) => hasPermission(user, p))) {
    throw new Error("Forbidden");
  }
}

export function canWrite(user: AuthUser): boolean {
  return (
    hasPermission(user, "clients.manage") ||
    hasPermission(user, "tasks.manage") ||
    hasPermission(user, "gates.manage")
  );
}

export function canAccessClient(user: AuthUser, clientAeId: string): boolean {
  if (!hasPermission(user, "clients.view") && !hasPermission(user, "clients.manage")) {
    return false;
  }
  if (ORG_WIDE_SLUGS.includes(user.role)) return true;
  if (user.role === "ae") return user.aeId === clientAeId;
  // Custom roles with clients.view: org-wide unless they have aeId set
  if (user.aeId) return user.aeId === clientAeId;
  return true;
}

export function canViewAudit(user: AuthUser): boolean {
  return hasPermission(user, "audit.view");
}

/** @deprecated prefer requirePermission */
export function requireWrite(user: AuthUser) {
  if (!canWrite(user)) {
    throw new Error("Forbidden");
  }
}

export function orgScope(user: AuthUser) {
  return { organizationId: user.organizationId };
}

export function clientVisibilityWhere(user: AuthUser) {
  const base = {
    organizationId: user.organizationId,
    deletedAt: null as Date | null,
  };
  if (user.role === "ae" && user.aeId) {
    return { ...base, aeId: user.aeId };
  }
  return base;
}

export function parsePermissions(raw: string[]): Permission[] {
  return raw.filter(isPermission);
}
