import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import {
  listNotifications,
  markNotificationsRead,
} from "@/lib/services/notifications";

export async function GET(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const data = await listNotifications(user);
    return apiJson({ data }, { requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}

export async function PATCH(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const body = (await req.json().catch(() => ({}))) as { ids?: string[] };
    await markNotificationsRead(user, body.ids);
    return apiJson({ ok: true }, { requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
