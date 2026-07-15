import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import { updateGateStatusService } from "@/lib/services/gates";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const { id } = await ctx.params;
    const body = await req.json();
    const gate = await updateGateStatusService(user, {
      gateId: id,
      status: body.status,
    });
    return apiJson(
      { data: { id: gate.id, status: gate.status, clientId: gate.clientId } },
      { requestId: rid },
    );
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
