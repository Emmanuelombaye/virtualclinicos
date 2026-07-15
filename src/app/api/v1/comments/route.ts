import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import {
  createCommentService,
  listCommentsService,
} from "@/lib/services/comments";

export async function GET(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const url = new URL(req.url);
    const entityType = url.searchParams.get("entityType") ?? "";
    const entityId = url.searchParams.get("entityId") ?? "";
    const data = await listCommentsService(user, entityType, entityId);
    return apiJson({ data }, { requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}

export async function POST(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const body = await req.json();
    const comment = await createCommentService(user, body);
    return apiJson({ data: comment }, { status: 201, requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
