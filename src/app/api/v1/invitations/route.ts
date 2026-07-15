import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import {
  createInvitationService,
  listInvitationsService,
} from "@/lib/services/invitations";

export async function GET(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const data = await listInvitationsService(user);
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
    const result = await createInvitationService(user, body);
    return apiJson(
      { data: { id: result.invitation.id, link: result.link } },
      { status: 201, requestId: rid },
    );
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
