import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listFieldDefsService } from "@/lib/services/custom-fields";
import { CustomFieldsAdmin } from "@/components/settings/CustomFieldsAdmin";

export default async function CustomFieldsSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "custom_fields.manage")) redirect("/command-center");

  const defs = await listFieldDefsService(user);

  return (
    <div>
      <PageHeader
        title="Custom fields"
        subtitle="Org-defined fields on clients (and more)"
        showNewClient={false}
      />
      <CustomFieldsAdmin
        initial={defs.map((d) => ({
          id: d.id,
          entityType: d.entityType,
          key: d.key,
          label: d.label,
          fieldType: d.fieldType,
        }))}
      />
    </div>
  );
}
