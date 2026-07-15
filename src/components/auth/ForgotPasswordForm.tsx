"use client";

import { useState, useTransition } from "react";
import { forgotPasswordAction } from "@/lib/auth/actions";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-6 space-y-3"
      action={(fd) => {
        setError(null);
        setMessage(null);
        start(async () => {
          const res = await forgotPasswordAction(fd);
          if (res && "ok" in res && res.ok === false && "message" in res) {
            setError(res.message);
          } else if (res && "message" in res) {
            setMessage(res.message);
          }
        });
      }}
    >
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-slate-500">
          Email
        </span>
        <input
          name="email"
          type="email"
          required
          className="h-10 w-full rounded-lg border border-vco-border px-3 text-sm outline-none focus:border-[#2E5BFF]"
        />
      </label>
      {error ? <p className="text-sm text-[#B42318]">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="flex h-10 w-full items-center justify-center rounded-lg bg-[#2E5BFF] text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <p className="text-center text-xs text-vco-muted">
        <Link href="/login" className="font-semibold text-[#1E40FF]">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
