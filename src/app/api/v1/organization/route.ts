import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import {
  getOrganizationService,
  updateOrganizationService,
} from "@/lib/services/organization";

export async function GET(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const org = await getOrganizationService(user);
    return apiJson({ data: org }, { requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}

export async function PATCH(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const body = await req.json();
    const org = await updateOrganizationService(user, body);
    return apiJson({ data: org }, { requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
