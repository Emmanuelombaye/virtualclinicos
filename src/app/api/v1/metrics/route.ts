import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const orgId = user.organizationId;
    const day = new Date().toISOString().slice(0, 10);

    const [
      clients,
      openTasks,
      openRisks,
      auditErrors,
      usageToday,
      topRoutes,
    ] = await Promise.all([
      prisma.client.count({
        where: { organizationId: orgId, deletedAt: null },
      }),
      prisma.task.count({
        where: {
          organizationId: orgId,
          status: { not: "Done" },
          deletedAt: null,
          client: { deletedAt: null },
        },
      }),
      prisma.risk.count({
        where: {
          organizationId: orgId,
          status: { not: "Closed" },
          deletedAt: null,
          client: { deletedAt: null },
        },
      }),
      prisma.auditLog.count({
        where: {
          organizationId: orgId,
          action: { contains: "error" },
        },
      }),
      prisma.apiUsageDaily.aggregate({
        where: { organizationId: orgId, day },
        _sum: { count: true, errors: true },
      }),
      prisma.apiUsageDaily.findMany({
        where: { organizationId: orgId, day },
        orderBy: { count: "desc" },
        take: 10,
      }),
    ]);

    return apiJson(
      {
        organizationId: orgId,
        clients,
        openTasks,
        openRisks,
        errorEvents: auditErrors,
        api: {
          requestsToday: usageToday._sum.count ?? 0,
          errorsToday: usageToday._sum.errors ?? 0,
          topRoutes,
        },
      },
      { requestId: rid },
    );
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
