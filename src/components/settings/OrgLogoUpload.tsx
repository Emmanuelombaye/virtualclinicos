"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrgSettingsAction } from "@/lib/actions";

export function OrgLogoUpload({ logoFileId }: { logoFileId: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-vco-border bg-white p-5">
      <h2 className="mb-2 text-sm font-semibold text-vco-ink">Organization logo</h2>
      <p className="mb-3 text-xs text-vco-muted">
        Uploads to local storage and links on the org record.
        {logoFileId ? ` Current file: ${logoFileId}` : " No logo yet."}
      </p>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-vco-border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
        {pending ? "Uploading…" : "Upload logo"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={pending}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            start(async () => {
              setMsg(null);
              const fd = new FormData();
              fd.append("file", file);
              fd.append("entityType", "Organization");
              const res = await fetch("/api/v1/files", { method: "POST", body: fd });
              const j = await res.json();
              if (!res.ok) {
                setMsg(j.error ?? "Upload failed");
                return;
              }
              await updateOrgSettingsAction({ logoFileId: j.data.id });
              setMsg("Logo saved");
              router.refresh();
            });
          }}
        />
      </label>
      {msg ? <p className="mt-2 text-xs text-emerald-700">{msg}</p> : null}
      {logoFileId ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/v1/files/${logoFileId}/download`}
          alt="Org logo"
          className="mt-3 h-12 w-auto rounded border border-vco-border object-contain"
        />
      ) : null}
    </div>
  );
}
