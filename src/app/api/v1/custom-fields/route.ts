import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import {
  createFieldDefService,
  getFieldValuesService,
  listFieldDefsService,
  setFieldValueService,
} from "@/lib/services/custom-fields";

export async function GET(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType") ?? undefined;
    const entityId = searchParams.get("entityId");
    if (entityType && entityId) {
      const values = await getFieldValuesService(user, entityType, entityId);
      return apiJson({ data: values }, { requestId: rid });
    }
    const defs = await listFieldDefsService(user, entityType);
    return apiJson({ data: defs }, { requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}

export async function POST(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const body = await req.json();
    if (body.fieldDefId) {
      const data = await setFieldValueService(user, body);
      return apiJson({ data }, { requestId: rid });
    }
    const data = await createFieldDefService(user, body);
    return apiJson({ data }, { status: 201, requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
