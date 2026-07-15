import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import {
  createAutomationService,
  listAutomationsService,
  setAutomationEnabledService,
} from "@/lib/services/automations";
import { isFeatureEnabled } from "@/lib/services/flags";

export async function GET(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    if (!(await isFeatureEnabled(user.organizationId, "automations"))) {
      return apiJson({ data: [], disabled: true }, { requestId: rid });
    }
    const data = await listAutomationsService(user);
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
    if (typeof body.enabled === "boolean" && body.id) {
      const data = await setAutomationEnabledService(user, body.id, body.enabled);
      return apiJson({ data }, { requestId: rid });
    }
    const data = await createAutomationService(user, body);
    return apiJson({ data }, { status: 201, requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
