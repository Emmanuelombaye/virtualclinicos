import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import {
  createClientService,
  listClientsService,
} from "@/lib/services/clients";
import { mapClient } from "@/lib/mappers";
import { prisma } from "@/lib/db";
import { computeDelayRisk } from "@/lib/delay-risk";

export async function GET(req: Request) {
  const rid = requestId(req);
  try {
    const { user, rateLimit } = await resolveAuthWithRateLimit(req);
    const rows = await listClientsService(user);
    const withRisk = await Promise.all(
      rows.map(async (c) => {
        const [overdueTasks, openCriticalRisks, ae] = await Promise.all([
          prisma.task.count({
            where: {
              clientId: c.id,
              deletedAt: null,
              status: { not: "Done" },
              due: { lt: new Date().toISOString().slice(0, 10) },
            },
          }),
          prisma.risk.count({
            where: {
              clientId: c.id,
              deletedAt: null,
              severity: "Critical",
              status: { not: "Closed" },
            },
          }),
          prisma.accountExecutive.findUnique({
            where: {
              organizationId_id: {
                organizationId: user.organizationId,
                id: c.aeId,
              },
            },
          }),
        ]);
        const delayRisk = computeDelayRisk({
          overdueTasks,
          openCriticalRisks,
          aeCapacityLoad: ae?.capacityLoad ?? 0,
          waitDays: c.waitDays,
          daysToLaunch: c.daysToLaunch,
          criticalOverdue: c.criticalOverdue,
        });
        return { ...mapClient(c), delayRisk };
      }),
    );
    const res = apiJson({ data: withRisk }, { requestId: rid });
    if (rateLimit) {
      res.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
      res.headers.set("X-RateLimit-Limit", String(rateLimit.limit));
    }
    return res;
  } catch (err) {
    return mapServiceError(err, rid);
  }
}

export async function POST(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const body = await req.json();
    const client = await createClientService(user, body);
    return apiJson(
      { data: { id: client.id, name: client.name } },
      { status: 201, requestId: rid },
    );
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
