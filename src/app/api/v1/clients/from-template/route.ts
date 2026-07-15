import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import { createClientFromTemplateService } from "@/lib/services/templates";

export async function POST(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const body = await req.json();
    const client = await createClientFromTemplateService(user, body);
    return apiJson(
      { data: { id: client.id, name: client.name } },
      { status: 201, requestId: rid },
    );
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
