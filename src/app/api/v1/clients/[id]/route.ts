import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiError, apiJson, mapServiceError, requestId } from "@/lib/api";
import { getClientService } from "@/lib/services/clients";
import { mapClient } from "@/lib/mappers";
import { prisma } from "@/lib/db";
import { computeDelayRisk } from "@/lib/delay-risk";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const { id } = await ctx.params;
    const clientId = Number(id);
    if (!Number.isFinite(clientId)) {
      return apiError("Invalid id", 400, rid);
    }
    const row = await getClientService(user, clientId);
    if (!row) return apiError("Not found", 404, rid);

    const [overdueTasks, openCriticalRisks, ae] = await Promise.all([
      prisma.task.count({
        where: {
          clientId,
          deletedAt: null,
          status: { not: "Done" },
        },
      }),
      prisma.risk.count({
        where: {
          clientId,
          deletedAt: null,
          severity: "Critical",
          status: { not: "Closed" },
        },
      }),
      prisma.accountExecutive.findUnique({
        where: {
          organizationId_id: {
            organizationId: user.organizationId,
            id: row.aeId,
          },
        },
      }),
    ]);
    const delayRisk = computeDelayRisk({
      overdueTasks,
      openCriticalRisks,
      aeCapacityLoad: ae?.capacityLoad ?? 0,
      waitDays: row.waitDays,
      daysToLaunch: row.daysToLaunch,
      criticalOverdue: row.criticalOverdue,
    });

    return apiJson(
      { data: { ...mapClient(row), delayRisk, version: row.version } },
      { requestId: rid },
    );
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
