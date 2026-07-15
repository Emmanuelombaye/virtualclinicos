"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { revokeInvitationAction } from "@/lib/actions";

export function RevokeInviteButton({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="text-[11px] font-semibold text-[#B42318] hover:underline disabled:opacity-50"
      onClick={() =>
        start(async () => {
          await revokeInvitationAction(invitationId);
          router.refresh();
        })
      }
    >
      {pending ? "…" : "Revoke"}
    </button>
  );
}
