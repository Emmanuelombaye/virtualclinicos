"use client";

import { useEffect, useState } from "react";

const SHORTCUTS = [
  { keys: "⌘ / Ctrl + K", label: "Open global search" },
  { keys: "?", label: "Open this help panel" },
  { keys: "Esc", label: "Close dialogs / search" },
];

const FAQ = [
  {
    q: "What are launch gates?",
    a: "Each clinic client tracks 24 launch gates across 11 delivery phases. Health is computed from gate completion, wait days, risks, and AE load.",
  },
  {
    q: "Who can invite teammates?",
    a: "Users with Team invite permission can send invites from Settings → Team. Invitees set a password on accept.",
  },
  {
    q: "Demo accounts",
    a: "Use alex@virtualclinicos.com (CEO), maya@… (AE), or viewer@… — password demo.",
  },
];

export function HelpPanel() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const typing =
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable);
      if (typing) return;
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center rounded-lg border border-vco-border bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        aria-label="Help and keyboard shortcuts"
      >
        Help
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/20 p-3 sm:p-4">
          <button
            type="button"
            aria-label="Close help"
            className="absolute inset-0"
            onClick={() => setOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-full max-w-md flex-col overflow-hidden rounded-2xl border border-vco-border bg-white shadow-[0_16px_50px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-vco-border px-4 py-3">
              <div>
                <h2 className="text-base font-semibold text-vco-ink">
                  Help & shortcuts
                </h2>
                <p className="text-xs text-vco-muted">
                  Press ? anytime to reopen
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-vco-border px-2.5 py-1 text-sm font-semibold text-slate-600"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Keyboard
              </h3>
              <ul className="mt-2 space-y-2">
                {SHORTCUTS.map((s) => (
                  <li
                    key={s.keys}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-slate-700">{s.label}</span>
                    <kbd className="rounded border border-vco-border bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {s.keys}
                    </kbd>
                  </li>
                ))}
              </ul>

              <h3 className="mt-6 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Quick answers
              </h3>
              <ul className="mt-2 space-y-3">
                {FAQ.map((f) => (
                  <li key={f.q}>
                    <div className="text-sm font-semibold text-vco-ink">{f.q}</div>
                    <p className="mt-1 text-sm text-vco-muted">{f.a}</p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
