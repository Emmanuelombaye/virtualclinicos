"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SearchResult = {
  clients: { id: number; name: string; phase: number; health: string }[];
  tasks: {
    id: string;
    title: string;
    status: string;
    clientId: number;
    clientName: string;
  }[];
  risks: {
    id: string;
    title: string;
    severity: string;
    clientId: number;
    clientName: string;
  }[];
  users: { id: string; name: string; email: string; role: string }[];
  files: { id: string; name: string; mimeType: string; clientId: number | null }[];
};

const EMPTY: SearchResult = {
  clients: [],
  tasks: [],
  risks: [],
  users: [],
  files: [],
};

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult>(EMPTY);
  const [activeIdx, setActiveIdx] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const trimmed = q.trim();
  const canSearch = trimmed.length >= 2;

  const flatLinks = [
    ...results.clients.map((c) => ({
      key: `c-${c.id}`,
      href: `/clients/${c.id}`,
      label: c.name,
    })),
    ...results.tasks.map((t) => ({
      key: `t-${t.id}`,
      href: `/clients/${t.clientId}`,
      label: t.title,
    })),
    ...results.risks.map((r) => ({
      key: `r-${r.id}`,
      href: `/clients/${r.clientId}`,
      label: r.title,
    })),
    ...results.files.map((f) => ({
      key: `f-${f.id}`,
      href: f.clientId ? `/clients/${f.clientId}` : "/command-center",
      label: f.name,
    })),
  ];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!canSearch) {
      setResults(EMPTY);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
        );
        if (res.ok) {
          setResults(await res.json());
          setActiveIdx(0);
        }
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [canSearch, trimmed]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQ("");
      router.push(href);
    },
    [router],
  );

  const empty =
    !loading &&
    canSearch &&
    flatLinks.length === 0 &&
    results.users.length === 0;

  return (
    <div ref={boxRef} className="relative">
      <label className="relative block">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">
          ⌕
        </span>
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open || !flatLinks.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIdx((i) => Math.min(i + 1, flatLinks.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIdx((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const item = flatLinks[activeIdx];
              if (item) go(item.href);
            }
          }}
          placeholder="Search… ⌘K"
          className="h-9 w-[min(220px,42vw)] rounded-lg border border-vco-border bg-white pr-3 pl-8 text-sm outline-none placeholder:text-slate-400 focus:border-[#2E5BFF] sm:w-[260px]"
        />
      </label>

      {open && (canSearch || q.length === 0) ? (
        <div className="absolute top-[calc(100%+6px)] right-0 z-50 max-h-[70vh] w-[min(400px,92vw)] overflow-y-auto rounded-xl border border-vco-border bg-white shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
          {!canSearch ? (
            <div className="px-3 py-3 text-sm text-vco-muted">
              Type 2+ characters. Navigate with ↑↓ Enter.
            </div>
          ) : null}
          {loading ? (
            <div className="px-3 py-3 text-sm text-vco-muted">Searching…</div>
          ) : null}
          {empty ? (
            <div className="px-3 py-3 text-sm text-vco-muted">No matches</div>
          ) : null}

          {results.clients.length > 0 ? (
            <Section title="Clients">
              {results.clients.map((c) => (
                <Link
                  key={c.id}
                  href={`/clients/${c.id}`}
                  onClick={() => {
                    setOpen(false);
                    setQ("");
                  }}
                  className="block rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
                >
                  <div className="font-semibold text-vco-ink">{c.name}</div>
                  <div className="text-xs text-vco-muted">
                    P{c.phase} · {c.health}
                  </div>
                </Link>
              ))}
            </Section>
          ) : null}

          {results.tasks.length > 0 ? (
            <Section title="Tasks">
              {results.tasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => go(`/clients/${t.clientId}`)}
                  className="block w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <div className="font-semibold text-vco-ink">{t.title}</div>
                  <div className="text-xs text-vco-muted">
                    {t.clientName} · {t.status}
                  </div>
                </button>
              ))}
            </Section>
          ) : null}

          {results.risks.length > 0 ? (
            <Section title="Risks">
              {results.risks.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => go(`/clients/${r.clientId}`)}
                  className="block w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <div className="font-semibold text-vco-ink">{r.title}</div>
                  <div className="text-xs text-vco-muted">
                    {r.clientName} · {r.severity}
                  </div>
                </button>
              ))}
            </Section>
          ) : null}

          {results.users.length > 0 ? (
            <Section title="People">
              {results.users.map((u) => (
                <div
                  key={u.id}
                  className="rounded-lg px-2 py-2 text-sm text-slate-700"
                >
                  <div className="font-semibold text-vco-ink">{u.name}</div>
                  <div className="text-xs text-vco-muted">
                    {u.email} · {u.role}
                  </div>
                </div>
              ))}
            </Section>
          ) : null}

          {results.files.length > 0 ? (
            <Section title="Files">
              {results.files.map((f) => (
                <a
                  key={f.id}
                  href={`/api/v1/files/${f.id}/download`}
                  className="block rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
                >
                  <div className="font-semibold text-vco-ink">{f.name}</div>
                  <div className="text-xs text-vco-muted">{f.mimeType}</div>
                </a>
              ))}
            </Section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-vco-border p-2 last:border-0">
      <div className="px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
        {title}
      </div>
      {children}
    </div>
  );
}
