import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { ToastProvider } from "@/components/ui/Toast";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { unreadNotificationCount } from "@/lib/services/notifications";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const clientWhere = {
    organizationId: user.organizationId,
    deletedAt: null as Date | null,
    ...(user.role === "ae" && user.aeId ? { aeId: user.aeId } : {}),
  };

  const [clientCount, openTaskCount, unread] = await Promise.all([
    prisma.client.count({ where: clientWhere }),
    prisma.task.count({
      where: {
        organizationId: user.organizationId,
        status: { not: "Done" },
        client: clientWhere,
      },
    }),
    unreadNotificationCount(user),
  ]);

  return (
    <ToastProvider>
      <AppShell
        user={user}
        navBadges={{ clients: clientCount, tasks: openTaskCount }}
        unreadNotifications={unread}
      >
        {children}
      </AppShell>
    </ToastProvider>
  );
}
