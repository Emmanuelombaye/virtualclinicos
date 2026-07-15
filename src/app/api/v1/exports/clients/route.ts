import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { mapServiceError, requestId } from "@/lib/api";
import { exportClientsCsvService } from "@/lib/services/imports";

export async function GET(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const csv = await exportClientsCsvService(user);
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="clients.csv"',
        "x-request-id": rid,
      },
    });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
