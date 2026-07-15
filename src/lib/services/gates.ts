import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";
import { writeActivity } from "@/lib/activity";
import { z } from "zod";
import {
  assertClientAccess,
  refreshClientHealth,
} from "@/lib/services/clients";
import { runAutomations } from "@/lib/services/automations";
import { dispatchWebhooks } from "@/lib/services/webhooks";

export const GateStatusSchema = z.enum([
  "Complete",
  "In Progress",
  "Not Started",
]);

export async function updateGateStatusService(
  user: AuthUser,
  input: {
    gateId: string;
    status: z.infer<typeof GateStatusSchema>;
    version?: number;
  },
) {
  const status = GateStatusSchema.parse(input.status);
  if (status === "Complete") {
    requirePermission(user, "gates.close");
  } else {
    requirePermission(user, "gates.manage");
  }

  const existing = await prisma.clientGate.findFirst({
    where: {
      id: input.gateId,
      organizationId: user.organizationId,
    },
  });
  if (!existing) throw new Error("Not found");
  await assertClientAccess(user, existing.clientId);

  const expected = input.version ?? existing.version;
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.clientGate.updateMany({
      where: { id: input.gateId, version: expected },
      data: { status, version: expected + 1 },
    });
    if (updated.count === 0) {
      const { VersionConflictError } = await import("@/lib/services/revisions");
      throw new VersionConflictError();
    }
    const gate = await tx.clientGate.findUniqueOrThrow({
      where: { id: input.gateId },
    });

    const gates = await tx.clientGate.findMany({
      where: { clientId: gate.clientId },
    });
    const inFlight = gates
      .filter((g) => g.status === "In Progress")
      .sort((a, b) => b.phase - a.phase)[0];
    const lastDone = gates
      .filter((g) => g.status === "Complete")
      .sort((a, b) => b.phase - a.phase)[0];
    const nextPhase =
      inFlight?.phase ?? Math.min((lastDone?.phase ?? 1) + 1, 11);

    await tx.client.update({
      where: { id: gate.clientId },
      data: { phase: nextPhase },
    });

    return gate;
  });

  await refreshClientHealth(result.clientId);

  await writeAudit({
    user,
    action: "gate.status",
    entityType: "ClientGate",
    entityId: result.id,
    before: { status: existing.status },
    after: { status },
  });
  await writeActivity({
    user,
    action: "gate.status",
    entityType: "ClientGate",
    entityId: result.id,
    clientId: result.clientId,
    summary: `${user.name} set gate "${result.name}" to ${status}`,
  });

  void dispatchWebhooks(user.organizationId, "gate.status", {
    gateId: result.id,
    clientId: result.clientId,
    status,
  });

  if (status === "Complete") {
    void runAutomations({
      organizationId: user.organizationId,
      trigger: "gate.complete",
      clientId: result.clientId,
      actor: user,
      context: { gateId: result.id },
    });
  }

  return result;
}
