import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import {
  createViewService,
  deleteViewService,
  listViewsService,
} from "@/lib/services/views";

export async function GET(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const data = await listViewsService(user);
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
    const data = await createViewService(user, body);
    return apiJson({ data }, { status: 201, requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}

export async function DELETE(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) throw new Error("Invalid: id required");
    await deleteViewService(user, id);
    return apiJson({ ok: true }, { requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
