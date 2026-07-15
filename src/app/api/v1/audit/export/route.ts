import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { mapServiceError, requestId } from "@/lib/api";
import { exportAuditCsvService } from "@/lib/services/audit-export";

export async function GET(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const csv = await exportAuditCsvService(user);
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="audit-export.csv"',
        "x-request-id": rid,
      },
    });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
