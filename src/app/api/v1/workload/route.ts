import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import { getWorkloadService } from "@/lib/services/workload";

export async function GET(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const data = await getWorkloadService(user);
    return apiJson({ data }, { requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
