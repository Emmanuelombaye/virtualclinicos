import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const row = await prisma.dashboardLayout.findFirst({
      where: {
        organizationId: user.organizationId,
        userId: user.id,
      },
    });
    const widgets = row
      ? (JSON.parse(row.widgetsJson) as string[])
      : ["revenue", "tasks", "risks", "launches", "delay"];
    return apiJson({ data: { widgets } }, { requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}

export async function PUT(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const body = z
      .object({ widgets: z.array(z.string()).min(1).max(12) })
      .parse(await req.json());
    const existing = await prisma.dashboardLayout.findFirst({
      where: { organizationId: user.organizationId, userId: user.id },
    });
    const widgetsJson = JSON.stringify(body.widgets);
    if (existing) {
      await prisma.dashboardLayout.update({
        where: { id: existing.id },
        data: { widgetsJson },
      });
    } else {
      await prisma.dashboardLayout.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          widgetsJson,
        },
      });
    }
    return apiJson({ data: { widgets: body.widgets } }, { requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
