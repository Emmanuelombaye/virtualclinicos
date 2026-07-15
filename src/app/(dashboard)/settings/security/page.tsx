"use client";

import { useEffect, useState } from "react";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { Breadcrumbs } from "@/components/shell/Breadcrumbs";

export default function SecurityPage() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void fetch("/api/v1/organization")
      .then(() => undefined)
      .catch(() => undefined);
  }, []);

  async function toggle() {
    const res = await fetch("/api/v1/settings/mfa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !mfaEnabled, code: "000000" }),
    });
    const j = await res.json();
    if (res.ok) {
      setMfaEnabled(j.data.mfaEnabled);
      setMsg(j.data.note ?? "Updated");
    } else {
      setMsg(j.error ?? "Failed");
    }
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Account", href: "/settings/profile" },
          { label: "Security" },
        ]}
      />
      <h1 className="text-xl font-semibold">Security</h1>
      <p className="mt-1 text-sm text-vco-muted">
        Password and MFA settings for your account.
      </p>

      <ChangePasswordForm />

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-vco-ink">Multi-factor auth</h2>
        <p className="mt-1 text-sm text-vco-muted">
          MFA stub — enable stores a random secret; verify with 000000 in dev.
        </p>
        <button
          type="button"
          onClick={() => void toggle()}
          className="mt-4 rounded bg-[#2E5BFF] px-3 py-2 text-sm font-semibold text-white"
        >
          {mfaEnabled ? "Disable MFA" : "Enable MFA"}
        </button>
        {msg ? <p className="mt-2 text-xs">{msg}</p> : null}
      </div>

      <div className="mt-6 rounded border bg-white p-3 text-sm">
        <div className="font-semibold">SSO</div>
        <p className="mb-2 text-vco-muted">
          Provider stubs return 501 until OIDC apps are configured.
        </p>
        <div className="flex flex-wrap gap-3 text-xs font-semibold text-[#1E40FF]">
          <a href="/api/auth/sso/google/start">Google SSO stub</a>
          <a href="/api/auth/sso/microsoft/start">Microsoft / Entra stub</a>
        </div>
      </div>
    </div>
  );
}
