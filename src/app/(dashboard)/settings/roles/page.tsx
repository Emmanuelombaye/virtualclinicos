import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listRolesService } from "@/lib/services/organization";
import { PERMISSIONS, PERMISSION_LABELS } from "@/lib/auth/permissions-catalog";
import { RolePermissionsEditor } from "@/components/settings/RolePermissionsEditor";

export default async function RolesSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "roles.manage")) redirect("/command-center");

  const roles = await listRolesService(user);

  return (
    <div>
      <PageHeader
        title="Roles & permissions"
        subtitle="Fine-grained access control"
        showNewClient={false}
      />
      <div className="space-y-4">
        {roles.map((role) => (
          <RolePermissionsEditor
            key={role.id}
            role={{
              id: role.id,
              name: role.name,
              slug: role.slug,
              isSystem: role.isSystem,
              userCount: role._count.users,
              permissions: role.permissions.map((p) => p.permission),
            }}
            catalog={PERMISSIONS.map((p) => ({
              id: p,
              label: PERMISSION_LABELS[p],
            }))}
            locked={role.slug === "superadmin"}
          />
        ))}
      </div>
    </div>
  );
}
