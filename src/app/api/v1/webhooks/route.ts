import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import {
  createWebhookService,
  deleteWebhookService,
  listWebhooksService,
} from "@/lib/services/webhooks";

export async function GET(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const data = await listWebhooksService(user);
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
    const data = await createWebhookService(user, body);
    return apiJson({ data }, { status: 201, requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}

export async function DELETE(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const id = new URL(req.url).searchParams.get("id");
    if (!id) throw new Error("Invalid: id required");
    await deleteWebhookService(user, id);
    return apiJson({ ok: true }, { requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
