"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acceptInvitationAction } from "@/lib/actions";

export function AcceptInviteForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-6 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          setError(null);
          try {
            await acceptInvitationAction({
              token,
              name: String(fd.get("name")),
              password: String(fd.get("password")),
            });
            router.push("/command-center");
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed");
          }
        });
      }}
    >
      <p className="text-xs text-vco-muted">{email}</p>
      <input
        name="name"
        required
        placeholder="Your name"
        className="h-10 w-full rounded-lg border border-vco-border px-3 text-sm"
      />
      <input
        name="password"
        type="password"
        required
        minLength={6}
        placeholder="Choose a password"
        className="h-10 w-full rounded-lg border border-vco-border px-3 text-sm"
      />
      {error ? <p className="text-sm text-[#B42318]">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="flex h-10 w-full items-center justify-center rounded-lg bg-[#2E5BFF] text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Joining…" : "Accept invitation"}
      </button>
    </form>
  );
}
