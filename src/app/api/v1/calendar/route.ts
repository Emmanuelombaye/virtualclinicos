import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import { getCalendarEventsService } from "@/lib/services/calendar";
import { isFeatureEnabled } from "@/lib/services/flags";

export async function GET(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    if (!(await isFeatureEnabled(user.organizationId, "calendar"))) {
      return apiJson({ data: [], disabled: true }, { requestId: rid });
    }
    const data = await getCalendarEventsService(user);
    return apiJson({ data }, { requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
