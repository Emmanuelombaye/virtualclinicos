import { PageHeader } from "@/components/shell/PageHeader";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { Breadcrumbs } from "@/components/shell/Breadcrumbs";

export default function ProfilePage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/settings/profile" },
          { label: "Profile" },
        ]}
      />
      <PageHeader
        title="Profile"
        subtitle="Your name, timezone, and how you want to be notified."
        showNewClient={false}
      />
      <ProfileForm />
    </div>
  );
}
