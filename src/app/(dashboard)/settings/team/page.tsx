import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listInvitationsService } from "@/lib/services/invitations";
import { prisma } from "@/lib/db";
import { TeamInviteForm } from "@/components/settings/TeamInviteForm";
import { RevokeInviteButton } from "@/components/settings/RevokeInviteButton";
import { startImpersonationAction } from "@/lib/auth/impersonation-actions";

export default async function TeamSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "invitations.manage")) redirect("/command-center");

  const [invites, roles, members] = await Promise.all([
    listInvitationsService(user),
    prisma.role.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { organizationId: user.organizationId },
      include: { role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle="Members and invitations"
        showNewClient={false}
      />

      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-vco-border bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-vco-ink">
            Invite user
          </h2>
          <TeamInviteForm
            roles={roles.map((r) => ({ id: r.id, name: r.name, slug: r.slug }))}
          />
        </section>

        <section className="rounded-xl border border-vco-border bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-vco-ink">Members</h2>
          <ul className="space-y-2 text-sm">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between border-b border-vco-border py-2 last:border-0"
              >
                <span>
                  <span className="font-medium text-vco-ink">{m.name}</span>
                  <span className="block text-[11px] text-vco-muted">
                    {m.email}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {m.role.name}
                  </span>
                  {hasPermission(user, "users.impersonate") &&
                  m.id !== user.id &&
                  !user.impersonatorId ? (
                    <form action={startImpersonationAction}>
                      <input type="hidden" name="userId" value={m.id} />
                      <button
                        type="submit"
                        className="text-[11px] font-semibold text-[#1E40FF]"
                      >
                        Login as
                      </button>
                    </form>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-vco-border bg-white">
        <div className="border-b border-vco-border px-4 py-3 text-sm font-semibold">
          Invitations
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Invited by</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((i) => (
              <tr key={i.id} className="border-t border-vco-border">
                <td className="px-4 py-2">{i.email}</td>
                <td className="px-4 py-2">{i.role.name}</td>
                <td className="px-4 py-2">
                  {i.acceptedAt
                    ? "Accepted"
                    : i.revokedAt
                      ? "Revoked"
                      : "Pending"}
                </td>
                <td className="px-4 py-2 text-vco-muted">
                  {i.invitedBy.name}
                </td>
                <td className="px-4 py-2">
                  {!i.acceptedAt && !i.revokedAt ? (
                    <RevokeInviteButton invitationId={i.id} />
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
