"use client";

import { useState, useTransition } from "react";
import { createInvitationAction } from "@/lib/actions";

export function TeamInviteForm({
  roles,
}: {
  roles: { id: string; name: string; slug: string }[];
}) {
  const [pending, start] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          setError(null);
          setLink(null);
          try {
            const res = await createInvitationAction({
              email: String(fd.get("email")),
              roleId: String(fd.get("roleId")),
              aeId:
                String(fd.get("aeId") || "") || null,
            });
            if (res.ok) setLink(res.link);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed");
          }
        });
      }}
    >
      <input
        name="email"
        type="email"
        required
        placeholder="colleague@clinic.com"
        className="h-10 w-full rounded-lg border border-vco-border px-3 text-sm"
      />
      <select
        name="roleId"
        className="h-10 w-full rounded-lg border border-vco-border px-3 text-sm"
        defaultValue={roles.find((r) => r.slug === "ae")?.id ?? roles[0]?.id}
      >
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      <input
        name="aeId"
        placeholder="AE id if AE role (maya/devon/priya)"
        className="h-10 w-full rounded-lg border border-vco-border px-3 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#2E5BFF] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send invite"}
      </button>
      {link ? (
        <p className="break-all text-xs text-emerald-700">
          Invite link (also emailed to console): {link}
        </p>
      ) : null}
      {error ? <p className="text-sm text-[#B42318]">{error}</p> : null}
    </form>
  );
}
