import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClientsTable } from "@/components/views/ClientsTable";
import { ExportClientsButton } from "@/components/views/ExportClientsButton";
import { NewClientButton } from "@/components/views/NewClientButton";
import { getSessionUser } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/permissions";
import { getAllClients } from "@/lib/queries";
import { listViewsService } from "@/lib/services/views";

export default async function ClientsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const [clients, views] = await Promise.all([
    getAllClients(user),
    listViewsService(user),
  ]);

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} active accounts — filters & saved views.`}
        actions={<ExportClientsButton user={user} />}
      />

      {clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          body="Create a clinic account to start tracking launch gates and delivery work."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              {canWrite(user) ? <NewClientButton /> : null}
              <Link
                href="/settings/team"
                className="inline-flex h-9 items-center rounded-lg border border-vco-border bg-white px-3 text-sm font-semibold text-slate-700"
              >
                Invite team
              </Link>
            </div>
          }
        />
      ) : (
        <ClientsTable
          clients={clients}
          initialViews={views
            .filter((v) => v.entity === "Client")
            .map((v) => ({
              id: v.id,
              name: v.name,
              filterJson: v.filterJson,
            }))}
        />
      )}
    </div>
  );
}
