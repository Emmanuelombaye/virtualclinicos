import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import {
  commitClientImportService,
  previewClientImportService,
} from "@/lib/services/imports";

export async function POST(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const body = await req.json();
    if (body.csvText && !body.commit) {
      const preview = await previewClientImportService(user, body.csvText);
      return apiJson({ data: preview }, { requestId: rid });
    }
    const data = await commitClientImportService(user, body);
    return apiJson({ data }, { status: 201, requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
