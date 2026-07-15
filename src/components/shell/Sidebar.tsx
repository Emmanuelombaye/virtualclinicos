"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { AccountMenu } from "@/components/shell/AccountMenu";
import type { AuthUser } from "@/lib/auth/users";
import type { Permission } from "@/lib/auth/permissions-catalog";
import { cn } from "@/lib/ui";

type NavItem = {
  href: string;
  label: string;
  badgeKey?: "clients" | "tasks";
  permission?: Permission;
  roles?: string[];
};

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "OVERVIEW",
    items: [
      {
        href: "/command-center",
        label: "Command Center",
        permission: "analytics.view",
        roles: ["ceo", "superadmin", "viewer"],
      },
      {
        href: "/notifications",
        label: "Notifications",
        permission: "notifications.view",
      },
    ],
  },
  {
    section: "DELIVERY",
    items: [
      { href: "/clients", label: "Clients", badgeKey: "clients", permission: "clients.view" },
      { href: "/projects", label: "Projects", permission: "clients.view" },
      { href: "/deliverables", label: "Deliverables", permission: "clients.view" },
      { href: "/tasks", label: "Tasks", badgeKey: "tasks", permission: "clients.view" },
      { href: "/calendar", label: "Calendar", permission: "clients.view" },
      { href: "/gantt", label: "Gantt", permission: "clients.view" },
    ],
  },
  {
    section: "TEAM",
    items: [{ href: "/ae-dashboard", label: "AE Dashboard", permission: "clients.view" }],
  },
  {
    section: "ACCOUNT",
    items: [
      { href: "/settings/profile", label: "Profile" },
      { href: "/settings/security", label: "Security" },
    ],
  },
  {
    section: "WORKSPACE",
    items: [
      { href: "/settings/organization", label: "Org Settings", permission: "settings.manage" },
      { href: "/settings/team", label: "Team", permission: "invitations.manage" },
      { href: "/settings/roles", label: "Roles", permission: "roles.manage" },
      { href: "/settings/custom-fields", label: "Custom fields", permission: "custom_fields.manage" },
      { href: "/settings/automations", label: "Automations", permission: "automations.manage" },
    ],
  },
  {
    section: "PLATFORM",
    items: [
      { href: "/audit", label: "Audit", permission: "audit.view" },
      { href: "/settings/api-keys", label: "API Keys", permission: "api_keys.manage" },
      { href: "/settings/webhooks", label: "Webhooks", permission: "webhooks.manage" },
      { href: "/settings/flags", label: "Flags", permission: "flags.manage" },
      { href: "/settings/billing", label: "Billing", permission: "billing.view" },
      { href: "/marketplace", label: "Marketplace", permission: "settings.manage" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function canSee(user: AuthUser, item: NavItem) {
  if (item.permission && !user.permissions.includes(item.permission)) {
    return false;
  }
  if (item.roles && !item.roles.includes(user.role)) {
    if (item.href === "/command-center" && user.permissions.includes("analytics.view")) {
      return user.role !== "ae";
    }
    return false;
  }
  if (item.href === "/command-center" && user.role === "ae") return false;
  return true;
}

export function Sidebar({
  navBadges,
  user,
  unreadCount = 0,
}: {
  navBadges?: { clients: number; tasks: number };
  user: AuthUser;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const badges = navBadges ?? { clients: 0, tasks: 0 };
  const [open, setOpen] = useState(false);

  const nav = (
    <>
      <div className="px-5 py-5">
        <Link
          href={user.role === "ae" ? "/ae-dashboard" : "/command-center"}
          aria-label="VirtualClinicOS home"
          onClick={() => setOpen(false)}
        >
          <Logo size={32} />
        </Link>
        <div className="mt-2 truncate text-[11px] font-medium text-slate-400">
          {user.organizationName}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((group) => {
          const items = group.items.filter((i) => canSee(user, i));
          if (!items.length) return null;
          return (
            <div key={group.section} className="mb-4">
              <div className="px-2 pb-1.5 text-[10px] font-semibold tracking-[0.08em] text-slate-400">
                {group.section}
              </div>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                          active
                            ? "bg-[#EFF4FF] text-[#1E40FF]"
                            : "text-slate-600 hover:bg-slate-50",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              active ? "bg-[#2E5BFF]" : "bg-slate-300",
                            )}
                          />
                          {item.label}
                        </span>
                        {item.href === "/notifications" && unreadCount > 0 ? (
                          <span className="rounded-full bg-[#B42318] px-1.5 text-[11px] font-semibold text-white">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        ) : item.badgeKey ? (
                          <span className="rounded-full bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-600">
                            {badges[item.badgeKey]}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-vco-border px-3 py-3">
        <AccountMenu user={user} />
      </div>
    </>
  );

  return (
    <>
      <div className="fixed top-0 right-0 left-0 z-40 flex h-14 items-center justify-between border-b border-vco-border bg-white px-4 lg:hidden">
        <Logo size={28} />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative rounded-lg border border-vco-border px-3 py-1.5 text-sm font-semibold text-slate-700"
        >
          {open ? "Close" : "Menu"}
          {!open && unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 size-2 rounded-full bg-[#B42318]" />
          ) : null}
        </button>
      </div>

      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col border-r border-vco-border bg-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {nav}
      </aside>
    </>
  );
}
