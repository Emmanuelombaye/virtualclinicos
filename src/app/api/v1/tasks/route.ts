import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import {
  createTaskService,
  listTasksService,
} from "@/lib/services/tasks";
import { mapTask } from "@/lib/mappers";

export async function GET(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const rows = await listTasksService(user);
    return apiJson({ data: rows.map(mapTask) }, { requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}

export async function POST(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const body = await req.json();
    const task = await createTaskService(user, body);
    return apiJson(
      { data: { id: task.id, title: task.title, status: task.status } },
      { status: 201, requestId: rid },
    );
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
