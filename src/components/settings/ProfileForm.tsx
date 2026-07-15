"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { NotificationPrefs } from "@/lib/services/profile";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Singapore",
  "Australia/Sydney",
];

export function ProfileForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, start] = useTransition();

  useEffect(() => {
    void fetch("/api/v1/me")
      .then((r) => r.json())
      .then((j) => {
        if (j.data) {
          setName(j.data.name);
          setEmail(j.data.email);
          setTimezone(j.data.timezone ?? "UTC");
          setPrefs(j.data.prefs);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !prefs) {
    return (
      <p className="mt-4 text-sm text-vco-muted">Loading profile…</p>
    );
  }

  return (
    <form
      className="mt-4 max-w-xl space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        setError(null);
        start(async () => {
          const res = await fetch("/api/v1/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, timezone, prefs }),
          });
          const j = await res.json().catch(() => ({}));
          if (!res.ok) {
            setError(j.error ?? "Could not save profile");
            return;
          }
          setMsg("Profile saved");
          void fetch("/api/v1/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completeStep: "profile" }),
          });
          router.refresh();
        });
      }}
    >
      <section className="rounded-xl border border-vco-border bg-white p-4">
        <h2 className="text-sm font-semibold text-vco-ink">Account</h2>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">
              Display name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="h-10 w-full rounded-lg border border-vco-border px-3 text-sm outline-none focus:border-[#2E5BFF]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">
              Email
            </span>
            <input
              value={email}
              disabled
              className="h-10 w-full rounded-lg border border-vco-border bg-slate-50 px-3 text-sm text-slate-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">
              Timezone
            </span>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="h-10 w-full rounded-lg border border-vco-border px-3 text-sm outline-none focus:border-[#2E5BFF]"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-vco-border bg-white p-4">
        <h2 className="text-sm font-semibold text-vco-ink">
          Notification preferences
        </h2>
        <p className="mt-1 text-xs text-vco-muted">
          Control in-app alerts and which emails you receive.
        </p>
        <div className="mt-3 space-y-2">
          {(
            [
              ["inAppAll", "In-app notifications"],
              ["emailMentions", "Email when mentioned"],
              ["emailAssignments", "Email on task assignment"],
              ["emailDigest", "Daily digest emails"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-2 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) =>
                  setPrefs({ ...prefs, [key]: e.target.checked })
                }
                className="size-4 rounded border-slate-300"
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      {error ? <p className="text-sm text-[#B42318]">{error}</p> : null}
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#2E5BFF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
