import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  listNotifications,
} from "@/lib/services/notifications";
import { MarkAllReadButton } from "@/components/notifications/MarkAllReadButton";
import Link from "next/link";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "notifications.view")) redirect("/command-center");

  const items = await listNotifications(user);

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="In-app alerts for your account"
        showNewClient={false}
        actions={<MarkAllReadButton />}
      />
      <div className="overflow-hidden rounded-xl border border-vco-border bg-white">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-vco-muted">
            You are all caught up.
          </p>
        ) : (
          <ul className="divide-y divide-vco-border">
            {items.map((n) => (
              <li
                key={n.id}
                className={`px-4 py-3 ${n.readAt ? "" : "bg-[#F8FAFF]"}`}
              >
                <div className="text-sm font-semibold text-vco-ink">
                  {n.title}
                </div>
                <div className="text-sm text-slate-600">{n.body}</div>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-vco-muted">
                  <span>{n.createdAt.toLocaleString()}</span>
                  {n.href ? (
                    <Link href={n.href} className="font-semibold text-[#1E40FF]">
                      Open
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
