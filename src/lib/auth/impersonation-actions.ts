"use server";

import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/permissions";
import { createSession, getSessionUser, requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

export async function startImpersonationAction(formData: FormData) {
  const actor = await requireUser();
  requirePermission(actor, "users.impersonate");
  if (actor.impersonatorId) {
    throw new Error("Already impersonating");
  }
  const targetId = String(formData.get("userId") ?? "");
  const target = await prisma.user.findFirst({
    where: { id: targetId, organizationId: actor.organizationId },
  });
  if (!target) throw new Error("Not found");

  await writeAudit({
    user: actor,
    action: "user.impersonate_start",
    entityType: "User",
    entityId: target.id,
    after: { targetEmail: target.email },
  });

  await createSession(target.id, { impersonatorId: actor.id });
  redirect(target.aeId ? "/ae-dashboard" : "/command-center");
}

export async function stopImpersonationAction() {
  const user = await getSessionUser();
  if (!user?.impersonatorId) {
    redirect("/command-center");
  }
  await writeAudit({
    user,
    action: "user.impersonate_stop",
    entityType: "User",
    entityId: user.id,
  });
  await createSession(user.impersonatorId);
  redirect("/settings/team");
}
