import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

export const UpdateOrgSettingsInput = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  domain: z.string().trim().max(200).nullable().optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
  country: z.string().trim().min(2).max(80).optional(),
  fiscalYearStartMonth: z.number().int().min(1).max(12).optional(),
  workingHoursJson: z.string().optional(),
  notificationSettingsJson: z.string().optional(),
  logoFileId: z.string().nullable().optional(),
});

export async function getOrganizationService(user: AuthUser) {
  return prisma.organization.findUniqueOrThrow({
    where: { id: user.organizationId },
  });
}

export async function updateOrganizationService(
  user: AuthUser,
  input: z.infer<typeof UpdateOrgSettingsInput>,
) {
  requirePermission(user, "settings.manage");
  const data = UpdateOrgSettingsInput.parse(input);
  const before = await getOrganizationService(user);

  const org = await prisma.organization.update({
    where: { id: user.organizationId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.primaryColor !== undefined
        ? { primaryColor: data.primaryColor }
        : {}),
      ...(data.domain !== undefined ? { domain: data.domain } : {}),
      ...(data.timezone !== undefined ? { timezone: data.timezone } : {}),
      ...(data.country !== undefined ? { country: data.country } : {}),
      ...(data.fiscalYearStartMonth !== undefined
        ? { fiscalYearStartMonth: data.fiscalYearStartMonth }
        : {}),
      ...(data.workingHoursJson !== undefined
        ? { workingHoursJson: data.workingHoursJson }
        : {}),
      ...(data.notificationSettingsJson !== undefined
        ? { notificationSettingsJson: data.notificationSettingsJson }
        : {}),
      ...(data.logoFileId !== undefined
        ? { logoFileId: data.logoFileId }
        : {}),
    },
  });

  await writeAudit({
    user,
    action: "organization.update",
    entityType: "Organization",
    entityId: org.id,
    before: {
      name: before.name,
      timezone: before.timezone,
      primaryColor: before.primaryColor,
    },
    after: {
      name: org.name,
      timezone: org.timezone,
      primaryColor: org.primaryColor,
    },
  });

  return org;
}

export async function listRolesService(user: AuthUser) {
  requirePermission(user, "roles.manage");
  return prisma.role.findMany({
    where: { organizationId: user.organizationId },
    include: { permissions: true, _count: { select: { users: true } } },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });
}

export async function updateRolePermissionsService(
  user: AuthUser,
  input: { roleId: string; permissions: string[] },
) {
  requirePermission(user, "roles.manage");
  const role = await prisma.role.findFirst({
    where: { id: input.roleId, organizationId: user.organizationId },
  });
  if (!role) throw new Error("Not found");
  if (role.slug === "superadmin") {
    throw new Error("Forbidden");
  }

  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
    await tx.rolePermission.createMany({
      data: input.permissions.map((permission) => ({
        roleId: role.id,
        permission,
      })),
    });
  });

  await writeAudit({
    user,
    action: "role.permissions",
    entityType: "Role",
    entityId: role.id,
    after: { permissions: input.permissions },
  });

  return listRolesService(user);
}
