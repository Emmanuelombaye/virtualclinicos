import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";
import { writeActivity } from "@/lib/activity";
import { createNotification } from "@/lib/services/notifications";
import { z } from "zod";
import { assertClientAccess } from "@/lib/services/clients";
import { runAutomations } from "@/lib/services/automations";
import { dispatchWebhooks } from "@/lib/services/webhooks";
import { updateWithVersion, writeRevision } from "@/lib/services/revisions";

export const RiskStatusSchema = z.enum(["Open", "Mitigating", "Closed"]);

export const CreateCommInput = z.object({
  clientId: z.number().int().positive(),
  subject: z.string().trim().min(3).max(200),
  channel: z.enum(["Email", "Call", "Slack"]),
  whenLabel: z.string().trim().min(1).max(40).optional(),
});

export async function updateRiskStatusService(
  user: AuthUser,
  input: {
    riskId: string;
    status: z.infer<typeof RiskStatusSchema>;
    version?: number;
  },
) {
  requirePermission(user, "risks.manage");
  const status = RiskStatusSchema.parse(input.status);

  const existing = await prisma.risk.findFirst({
    where: {
      id: input.riskId,
      organizationId: user.organizationId,
      deletedAt: null,
    },
  });
  if (!existing) throw new Error("Not found");
  await assertClientAccess(user, existing.clientId);

  const expected = input.version ?? existing.version;
  const risk = await updateWithVersion<typeof existing>(
    "risk",
    input.riskId,
    expected,
    { status },
  );

  await writeRevision({
    user,
    entityType: "Risk",
    entityId: risk.id,
    version: risk.version,
    snapshot: risk,
  });

  await writeAudit({
    user,
    action: "risk.status",
    entityType: "Risk",
    entityId: risk.id,
    before: { status: existing.status },
    after: { status },
  });
  await writeActivity({
    user,
    action: "risk.status",
    entityType: "Risk",
    entityId: risk.id,
    clientId: risk.clientId,
    summary: `${user.name} set risk "${risk.title}" to ${status}`,
  });

  if (risk.severity === "Critical" && status === "Open") {
    const leaders = await prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
        role: { slug: { in: ["ceo", "superadmin"] } },
      },
    });
    for (const leader of leaders) {
      if (leader.id === user.id) continue;
      await createNotification({
        organizationId: user.organizationId,
        userId: leader.id,
        type: "risk.critical",
        title: "Critical risk open",
        body: risk.title,
        href: `/clients/${risk.clientId}`,
        emailTo: leader.email,
        sendEmail: true,
      });
    }
    void runAutomations({
      organizationId: user.organizationId,
      trigger: "risk.critical",
      clientId: risk.clientId,
      actor: user,
      context: { riskId: risk.id },
    });
    void dispatchWebhooks(user.organizationId, "risk.critical", {
      riskId: risk.id,
      clientId: risk.clientId,
      title: risk.title,
    });
  }

  return risk;
}

export async function createCommService(
  user: AuthUser,
  input: z.infer<typeof CreateCommInput>,
) {
  requirePermission(user, "comms.manage");
  const data = CreateCommInput.parse(input);
  await assertClientAccess(user, data.clientId);

  const comm = await prisma.comm.create({
    data: {
      organizationId: user.organizationId,
      clientId: data.clientId,
      subject: data.subject,
      channel: data.channel,
      whenLabel: data.whenLabel ?? "Just now",
    },
  });

  await writeAudit({
    user,
    action: "comm.create",
    entityType: "Comm",
    entityId: comm.id,
    after: {
      subject: comm.subject,
      channel: comm.channel,
      clientId: comm.clientId,
    },
  });
  await writeActivity({
    user,
    action: "comm.create",
    entityType: "Comm",
    entityId: comm.id,
    clientId: comm.clientId,
    summary: `${user.name} logged ${comm.channel}: ${comm.subject}`,
  });

  return comm;
}
