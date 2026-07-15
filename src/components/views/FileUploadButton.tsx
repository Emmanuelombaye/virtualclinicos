"use client";

import { useState, useTransition } from "react";

export function FileUploadButton({
  clientId,
  entityType,
  entityId,
}: {
  clientId: number;
  entityType?: string;
  entityId?: string;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-vco-border bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
      {pending ? "Uploading…" : "Upload file"}
      <input
        type="file"
        className="hidden"
        disabled={pending}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          start(async () => {
            setMsg(null);
            const fd = new FormData();
            fd.append("file", file);
            fd.append("clientId", String(clientId));
            if (entityType) fd.append("entityType", entityType);
            if (entityId) fd.append("entityId", entityId);
            const res = await fetch("/api/v1/files", {
              method: "POST",
              body: fd,
            });
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              setMsg(body.error ?? "Upload failed");
            } else {
              setMsg("Uploaded");
              window.location.reload();
            }
          });
        }}
      />
      {msg ? <span className="text-vco-muted">{msg}</span> : null}
    </label>
  );
}
