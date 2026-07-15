import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";
import { writeActivity } from "@/lib/activity";
import { z } from "zod";

function parseCsv(text: string): string[][] {
  return text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
}

export async function previewClientImportService(
  user: AuthUser,
  csvText: string,
) {
  requirePermission(user, "imports.manage");
  const rows = parseCsv(csvText);
  if (rows.length < 2) throw new Error("Invalid: empty CSV");
  const header = rows[0]!.map((h) => h.toLowerCase());
  const nameIdx = header.indexOf("name");
  const aeIdx = header.indexOf("aeid");
  const mrrIdx = header.indexOf("mrr");
  if (nameIdx < 0 || aeIdx < 0) {
    throw new Error("Invalid: CSV needs name,aeId columns");
  }
  const preview = rows.slice(1).map((cols, i) => {
    const name = cols[nameIdx] ?? "";
    const aeId = cols[aeIdx] ?? "";
    const mrr = mrrIdx >= 0 ? Number(cols[mrrIdx] ?? 0) : 0;
    const errors: string[] = [];
    if (name.length < 2) errors.push("name too short");
    if (!aeId) errors.push("aeId required");
    if (Number.isNaN(mrr)) errors.push("mrr invalid");
    return { row: i + 2, name, aeId, mrr, errors };
  });
  return preview;
}

export const CommitImportInput = z.object({
  rows: z.array(
    z.object({
      name: z.string().min(2),
      aeId: z.string().min(1),
      mrr: z.number().int().min(0).default(0),
    }),
  ),
});

export async function commitClientImportService(
  user: AuthUser,
  input: z.infer<typeof CommitImportInput>,
) {
  requirePermission(user, "imports.manage");
  const data = CommitImportInput.parse(input);
  const created: number[] = [];
  for (const row of data.rows) {
    const client = await prisma.client.create({
      data: {
        organizationId: user.organizationId,
        name: row.name,
        aeId: row.aeId,
        phase: 1,
        status: "Active",
        health: "green",
        daysToLaunch: 90,
        mrr: row.mrr,
        waitingOn: "Nothing",
        waitDays: 0,
        criticalOverdue: 0,
      },
    });
    created.push(client.id);
  }
  await writeAudit({
    user,
    action: "import.clients",
    entityType: "Organization",
    entityId: user.organizationId,
    after: { count: created.length },
  });
  await writeActivity({
    user,
    action: "import.clients",
    entityType: "Organization",
    entityId: user.organizationId,
    summary: `${user.name} imported ${created.length} clients`,
  });
  return { created };
}

export async function exportClientsCsvService(user: AuthUser) {
  requirePermission(user, "reports.export");
  const clients = await prisma.client.findMany({
    where: { organizationId: user.organizationId, deletedAt: null },
    orderBy: { id: "asc" },
  });
  const lines = ["id,name,aeId,phase,status,health,daysToLaunch,mrr,waitingOn,waitDays"];
  for (const c of clients) {
    lines.push(
      [
        c.id,
        JSON.stringify(c.name),
        c.aeId,
        c.phase,
        c.status,
        c.health,
        c.daysToLaunch,
        c.mrr,
        JSON.stringify(c.waitingOn),
        c.waitDays,
      ].join(","),
    );
  }
  return lines.join("\n");
}
