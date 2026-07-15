import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiError, apiJson, mapServiceError, requestId } from "@/lib/api";
import {
  listFilesService,
  uploadFileService,
} from "@/lib/services/files";

export async function GET(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const url = new URL(req.url);
    const clientId = url.searchParams.get("clientId");
    const data = await listFilesService(user, {
      clientId: clientId ? Number(clientId) : undefined,
      entityType: url.searchParams.get("entityType") ?? undefined,
      entityId: url.searchParams.get("entityId") ?? undefined,
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
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return apiError("file required", 400, rid);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const clientIdRaw = form.get("clientId");
    const uploaded = await uploadFileService(
      user,
      {
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        body: buffer,
      },
      {
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        clientId: clientIdRaw ? Number(clientIdRaw) : undefined,
        entityType: String(form.get("entityType") || "") || undefined,
        entityId: String(form.get("entityId") || "") || undefined,
        commentId: String(form.get("commentId") || "") || undefined,
      },
    );
    return apiJson({ data: uploaded }, { status: 201, requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
