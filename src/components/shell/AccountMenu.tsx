"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/lib/auth/actions";
import type { AuthUser } from "@/lib/auth/users";

export function AccountMenu({ user }: { user: AuthUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-lg p-1 text-left hover:bg-slate-50"
        aria-expanded={open}
      >
        <div className="flex size-9 items-center justify-center rounded-full bg-[#EFF4FF] text-xs font-bold text-[#1E40FF]">
          {user.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-vco-ink">
            {user.name}
          </div>
          <div className="truncate text-[11px] text-vco-muted">
            {user.roleName}
          </div>
        </div>
      </button>

      {open ? (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-full min-w-[200px] overflow-hidden rounded-xl border border-vco-border bg-white shadow-[0_12px_40px_rgba(15,23,42,0.12)]">
          <div className="border-b border-vco-border px-3 py-2">
            <div className="truncate text-xs font-semibold text-vco-ink">
              {user.email}
            </div>
          </div>
          <ul className="py-1 text-sm">
            <li>
              <Link
                href="/settings/profile"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-slate-700 hover:bg-slate-50"
              >
                Profile & prefs
              </Link>
            </li>
            <li>
              <Link
                href="/settings/security"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-slate-700 hover:bg-slate-50"
              >
                Security
              </Link>
            </li>
            <li>
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-slate-700 hover:bg-slate-50"
              >
                Notifications
              </Link>
            </li>
          </ul>
          <form action={logoutAction} className="border-t border-vco-border p-1">
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
