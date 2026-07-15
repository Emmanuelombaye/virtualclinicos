import type { AuthUser } from "@/lib/auth/users";
import { listAuditLogs } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/permissions";

export async function exportAuditCsvService(user: AuthUser) {
  requirePermission(user, "audit.view");
  const rows = await listAuditLogs(user, { limit: 2000 });
  const lines = [
    "id,createdAt,actor,action,entityType,entityId,impersonatorId",
  ];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.createdAt.toISOString(),
        JSON.stringify(r.actor?.email ?? ""),
        r.action,
        r.entityType,
        r.entityId,
        (r as { impersonatorId?: string | null }).impersonatorId ?? "",
      ].join(","),
    );
  }
  return lines.join("\n");
}
