import type { Permission } from "./permissions-catalog";

export type RoleSlug = "superadmin" | "ceo" | "ae" | "viewer" | string;

export type AuthUser = {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationPrimaryColor: string | null;
  name: string;
  initials: string;
  /** Role slug (system or custom) */
  role: RoleSlug;
  roleId: string;
  roleName: string;
  permissions: Permission[];
  /** AE portfolio scope; null for org-wide roles */
  aeId: string | null;
  email: string;
  /** Set when viewing as another user */
  impersonatorId?: string | null;
  /** Present when authenticated via API key */
  apiKeyId?: string | null;
};

export const DEMO_PASSWORD = "demo";

/** Shown on login UI — actual accounts live in DB (seeded). */
export const DEMO_LOGIN_HINTS: {
  name: string;
  role: RoleSlug;
  email: string;
}[] = [
  {
    name: "Alex Rivera",
    role: "ceo",
    email: "alex@virtualclinicos.com",
  },
  {
    name: "Maya Chen",
    role: "ae",
    email: "maya@virtualclinicos.com",
  },
  {
    name: "Devon Ray",
    role: "ae",
    email: "devon@virtualclinicos.com",
  },
  {
    name: "Priya Nair",
    role: "ae",
    email: "priya@virtualclinicos.com",
  },
  {
    name: "Vera View",
    role: "viewer",
    email: "viewer@virtualclinicos.com",
  },
];

export const SYSTEM_ROLE_SLUGS = ["superadmin", "ceo", "ae", "viewer"] as const;

export function isSystemRoleSlug(
  value: string,
): value is (typeof SYSTEM_ROLE_SLUGS)[number] {
  return (SYSTEM_ROLE_SLUGS as readonly string[]).includes(value);
}
