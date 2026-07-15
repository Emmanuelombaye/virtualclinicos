import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getOrganizationService } from "@/lib/services/organization";
import { OrgSettingsForm } from "@/components/settings/OrgSettingsForm";
import { OrgLogoUpload } from "@/components/settings/OrgLogoUpload";

export default async function OrgSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "settings.manage")) redirect("/command-center");

  const org = await getOrganizationService(user);

  return (
    <div>
      <PageHeader
        title="Organization settings"
        subtitle={org.name}
        showNewClient={false}
      />
      <div className="grid max-w-4xl gap-5 lg:grid-cols-2">
        <OrgSettingsForm
          initial={{
            name: org.name,
            primaryColor: org.primaryColor,
            domain: org.domain,
            timezone: org.timezone,
            country: org.country,
            fiscalYearStartMonth: org.fiscalYearStartMonth,
            notificationSettingsJson: org.notificationSettingsJson,
          }}
        />
        <OrgLogoUpload logoFileId={org.logoFileId} />
      </div>
    </div>
  );
}
