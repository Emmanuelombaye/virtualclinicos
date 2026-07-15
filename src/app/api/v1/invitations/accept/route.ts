import { apiJson, mapServiceError, requestId } from "@/lib/api";
import { acceptInvitationService } from "@/lib/services/invitations";

export async function POST(req: Request) {
  const rid = requestId(req);
  try {
    const body = await req.json();
    const user = await acceptInvitationService(body);
    return apiJson(
      { data: { id: user.id, email: user.email } },
      { status: 201, requestId: rid },
    );
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
