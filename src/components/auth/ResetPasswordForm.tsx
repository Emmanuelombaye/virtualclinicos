"use client";

import { useState, useTransition } from "react";
import { resetPasswordAction } from "@/lib/auth/actions";
import Link from "next/link";

export function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-6 space-y-3"
      action={(fd) => {
        setError(null);
        start(async () => {
          const res = await resetPasswordAction(fd);
          if (res && !res.ok) setError(res.error);
        });
      }}
    >
      <input type="hidden" name="token" value={token} />
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-slate-500">
          New password (min 8 characters)
        </span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="h-10 w-full rounded-lg border border-vco-border px-3 text-sm outline-none focus:border-[#2E5BFF]"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-slate-500">
          Confirm password
        </span>
        <input
          name="confirm"
          type="password"
          required
          minLength={8}
          className="h-10 w-full rounded-lg border border-vco-border px-3 text-sm outline-none focus:border-[#2E5BFF]"
        />
      </label>
      {error ? <p className="text-sm text-[#B42318]">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="flex h-10 w-full items-center justify-center rounded-lg bg-[#2E5BFF] text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Update password"}
      </button>
      <p className="text-center text-xs text-vco-muted">
        <Link href="/login" className="font-semibold text-[#1E40FF]">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
