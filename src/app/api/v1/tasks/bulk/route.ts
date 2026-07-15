import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import { bulkTasksService } from "@/lib/services/tasks";

export async function POST(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const body = await req.json();
    const data = await bulkTasksService(user, body);
    return apiJson({ data }, { requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
