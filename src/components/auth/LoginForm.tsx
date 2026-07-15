"use client";

import { useState, useTransition } from "react";
import { loginAction } from "@/lib/auth/actions";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-6 space-y-3"
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const res = await loginAction(fd);
          if (res && !res.ok) setError(res.error);
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
          defaultValue="alex@virtualclinicos.com"
          className="h-10 w-full rounded-lg border border-vco-border px-3 text-sm outline-none focus:border-[#2E5BFF]"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-slate-500">
          Password
        </span>
        <input
          name="password"
          type="password"
          required
          defaultValue="demo"
          className="h-10 w-full rounded-lg border border-vco-border px-3 text-sm outline-none focus:border-[#2E5BFF]"
        />
      </label>
      {error ? (
        <p className="text-sm font-medium text-[#B42318]">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="flex h-10 w-full items-center justify-center rounded-lg bg-[#2E5BFF] text-sm font-semibold text-white hover:bg-[#1E40FF] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-xs">
        <a href="/forgot-password" className="font-semibold text-[#1E40FF]">
          Forgot password?
        </a>
      </p>
    </form>
  );
}
