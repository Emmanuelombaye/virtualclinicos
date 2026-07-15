import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import { expandDueRecurringTasks } from "@/lib/services/recurring";
import { runTaskDigestTick } from "@/lib/services/digests";
import { requirePermission } from "@/lib/auth/permissions";
import { ensureJobHandlers, jobs } from "@/lib/infra/jobs";

export async function POST(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    requirePermission(user, "settings.manage");
    ensureJobHandlers();
    const [recurring, digest] = await Promise.all([
      expandDueRecurringTasks(user.organizationId),
      runTaskDigestTick(user.organizationId),
    ]);
    jobs.enqueue("recurring.tick", { organizationId: user.organizationId });
    jobs.enqueue("digest.tick", { organizationId: user.organizationId });
    return apiJson(
      { data: { recurring, digest }, queueDepth: jobs.depth() },
      { requestId: rid },
    );
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
