import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import { heartbeatPresence, listPresence } from "@/lib/services/presence";
import { z } from "zod";

export async function GET(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType") ?? "Client";
    const entityId = searchParams.get("entityId");
    if (!entityId) throw new Error("Invalid: entityId required");
    const data = listPresence({
      organizationId: user.organizationId,
      entityType,
      entityId,
      excludeUserId: user.id,
    });
    return apiJson({ data }, { requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}

export async function POST(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const body = z
      .object({
        entityType: z.string().default("Client"),
        entityId: z.string().min(1),
      })
      .parse(await req.json());
    heartbeatPresence({
      organizationId: user.organizationId,
      userId: user.id,
      name: user.name,
      entityType: body.entityType,
      entityId: body.entityId,
    });
    const data = listPresence({
      organizationId: user.organizationId,
      entityType: body.entityType,
      entityId: body.entityId,
      excludeUserId: user.id,
    });
    return apiJson({ data }, { requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
