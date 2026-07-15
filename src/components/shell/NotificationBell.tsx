"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Item = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationBell({ count }: { count: number }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/notifications");
      const j = await res.json();
      setItems((j.data ?? []).slice(0, 6));
    } finally {
      setLoading(false);
    }
  }

  async function markAll() {
    await fetch("/api/v1/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })));
    router.refresh();
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) void load();
        }}
        className="relative inline-flex h-9 items-center gap-2 rounded-lg border border-vco-border bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={count ? `${count} unread notifications` : "Notifications"}
      >
        Alerts
        {count > 0 ? (
          <span className="rounded-full bg-[#B42318] px-1.5 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[340px] overflow-hidden rounded-xl border border-vco-border bg-white shadow-[0_12px_40px_rgba(15,23,42,0.12)]">
          <div className="flex items-center justify-between border-b border-vco-border px-3 py-2">
            <span className="text-sm font-semibold text-vco-ink">Notifications</span>
            <button
              type="button"
              onClick={() => void markAll()}
              className="text-xs font-semibold text-[#1E40FF]"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="px-3 py-6 text-center text-sm text-vco-muted">
                Loading…
              </p>
            ) : items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-vco-muted">
                You&apos;re all caught up.
              </p>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id} className="border-b border-slate-50 last:border-0">
                    {n.href ? (
                      <Link
                        href={n.href}
                        onClick={() => setOpen(false)}
                        className="block px-3 py-2.5 hover:bg-slate-50"
                      >
                        <NotifRow item={n} />
                      </Link>
                    ) : (
                      <div className="px-3 py-2.5">
                        <NotifRow item={n} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-vco-border px-3 py-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-[#1E40FF]"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NotifRow({ item }: { item: Item }) {
  return (
    <>
      <div className="flex items-start gap-2">
        {!item.readAt ? (
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#2E5BFF]" />
        ) : (
          <span className="mt-1.5 size-1.5 shrink-0" />
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-vco-ink">
            {item.title}
          </div>
          <div className="mt-0.5 line-clamp-2 text-xs text-vco-muted">
            {item.body}
          </div>
        </div>
      </div>
    </>
  );
}
