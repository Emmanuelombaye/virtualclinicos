import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import {
  createApiKeyService,
  listApiKeysService,
  revokeApiKeyService,
} from "@/lib/services/api-keys";

export async function GET(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const data = await listApiKeysService(user);
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
    if (body.revokeId) {
      const data = await revokeApiKeyService(user, body.revokeId);
      return apiJson({ data }, { requestId: rid });
    }
    const { key, raw } = await createApiKeyService(user, body);
    return apiJson(
      { data: { ...key, token: raw } },
      { status: 201, requestId: rid },
    );
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
