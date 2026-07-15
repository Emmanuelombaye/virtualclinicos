import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { HelpPanel } from "./HelpPanel";
import { ImpersonationBanner } from "./ImpersonationBanner";
import type { AuthUser } from "@/lib/auth/users";

export function AppShell({
  children,
  navBadges,
  user,
  unreadNotifications = 0,
}: {
  children: React.ReactNode;
  navBadges?: { clients: number; tasks: number };
  user: AuthUser;
  unreadNotifications?: number;
}) {
  const accent = user.organizationPrimaryColor ?? "#2E5BFF";

  return (
    <div
      className="flex min-h-screen flex-col bg-vco-surface"
      style={{ ["--vco-accent" as string]: accent }}
    >
      {user.impersonatorId ? (
        <ImpersonationBanner targetName={user.name} />
      ) : null}
      <div className="flex min-h-0 flex-1">
        <Sidebar
          navBadges={navBadges}
          user={user}
          unreadCount={unreadNotifications}
        />
        <main className="relative min-w-0 flex-1 overflow-x-auto pt-14 lg:pt-0">
          <div className="pointer-events-none absolute top-3 right-4 z-30 hidden items-center gap-2 lg:flex">
            <div className="pointer-events-auto flex items-center gap-2">
              <HelpPanel />
              <NotificationBell count={unreadNotifications} />
            </div>
          </div>
          <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
            <div className="mb-3 flex justify-end gap-2 lg:hidden">
              <HelpPanel />
              <NotificationBell count={unreadNotifications} />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
