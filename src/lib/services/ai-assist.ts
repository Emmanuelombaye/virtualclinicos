import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";
import { getAiProvider } from "@/lib/infra/ai";
import { computeDelayRisk } from "@/lib/delay-risk";
import { isFeatureEnabled } from "@/lib/services/flags";
import { z } from "zod";

export const SummarizeInput = z.object({
  clientId: z.number().int().positive(),
});

export async function summarizeLaunchService(
  user: AuthUser,
  input: z.infer<typeof SummarizeInput>,
) {
  requirePermission(user, "ai.use");
  if (!(await isFeatureEnabled(user.organizationId, "ai_assistant"))) {
    throw new Error("Forbidden");
  }
  const data = SummarizeInput.parse(input);
  const client = await prisma.client.findFirst({
    where: {
      id: data.clientId,
      organizationId: user.organizationId,
      deletedAt: null,
    },
    include: {
      ae: true,
      tasks: { where: { deletedAt: null } },
      risks: { where: { deletedAt: null } },
      gates: true,
    },
  });
  if (!client) throw new Error("Not found");

  const overdue = client.tasks.filter(
    (t) => t.status !== "Done" && /\d{4}-\d{2}-\d{2}/.test(t.due) && new Date(t.due) < new Date(),
  ).length;
  const critical = client.risks.filter(
    (r) => r.severity === "Critical" && r.status !== "Closed",
  ).length;
  const delay = computeDelayRisk({
    overdueTasks: overdue,
    openCriticalRisks: critical,
    aeCapacityLoad: client.ae.capacityLoad,
    waitDays: client.waitDays,
    daysToLaunch: client.daysToLaunch,
    criticalOverdue: client.criticalOverdue,
  });

  const prompt = [
    `Summarize launch readiness for client "${client.name}".`,
    `Phase ${client.phase}, days to launch ${client.daysToLaunch}, health ${client.health}.`,
    `Waiting on: ${client.waitingOn} (${client.waitDays}d).`,
    `Tasks: ${client.tasks.length} total, ${overdue} overdue. Risks critical open: ${critical}.`,
    `Delay risk score: ${delay.score}. Reasons: ${delay.reasons.join("; ") || "none"}.`,
    `Gates: ${client.gates.map((g) => `${g.name}=${g.status}`).join(", ")}.`,
    `Suggest next steps and a short status update draft.`,
  ].join("\n");

  const text = await getAiProvider().complete([
    { role: "system", content: "You are a clinic launch ops assistant." },
    { role: "user", content: prompt },
  ]);

  await writeAudit({
    user,
    action: "ai.summarize_launch",
    entityType: "Client",
    entityId: String(client.id),
    after: { delayRisk: delay.score },
  });

  return { text, delayRisk: delay };
}
