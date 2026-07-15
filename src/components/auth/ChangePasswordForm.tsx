"use client";

import { useState, useTransition } from "react";
import { changePasswordAction } from "@/lib/auth/actions";

export function ChangePasswordForm() {
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-4 max-w-md space-y-3 rounded-xl border border-vco-border bg-white p-4"
      action={(fd) => {
        setMsg(null);
        setError(null);
        start(async () => {
          const res = await changePasswordAction(fd);
          if (res.ok) {
            setMsg("Password updated");
            (document.getElementById("change-pw-form") as HTMLFormElement | null)?.reset();
          } else {
            setError(res.error.replace(/^Invalid:\s*/, ""));
          }
        });
      }}
      id="change-pw-form"
    >
      <h2 className="text-sm font-semibold text-vco-ink">Change password</h2>
      <input
        name="currentPassword"
        type="password"
        required
        placeholder="Current password"
        className="h-10 w-full rounded-lg border border-vco-border px-3 text-sm"
      />
      <input
        name="newPassword"
        type="password"
        required
        minLength={8}
        placeholder="New password (min 8)"
        className="h-10 w-full rounded-lg border border-vco-border px-3 text-sm"
      />
      {error ? <p className="text-sm text-[#B42318]">{error}</p> : null}
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#2E5BFF] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
