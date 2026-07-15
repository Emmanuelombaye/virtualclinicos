import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

export const SavedViewInput = z.object({
  name: z.string().trim().min(1).max(80),
  entity: z.enum(["Client", "Task", "Risk"]),
  filterJson: z.string().min(2),
  isShared: z.boolean().optional(),
});

export async function listViewsService(user: AuthUser) {
  return prisma.savedView.findMany({
    where: {
      organizationId: user.organizationId,
      OR: [{ userId: user.id }, { isShared: true }],
    },
    orderBy: { name: "asc" },
  });
}

export async function createViewService(
  user: AuthUser,
  input: z.infer<typeof SavedViewInput>,
) {
  const data = SavedViewInput.parse(input);
  if (data.isShared) requirePermission(user, "views.manage");
  const view = await prisma.savedView.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      name: data.name,
      entity: data.entity,
      filterJson: data.filterJson,
      isShared: data.isShared ?? false,
    },
  });
  await writeAudit({
    user,
    action: "view.create",
    entityType: "SavedView",
    entityId: view.id,
    after: { name: view.name },
  });
  return view;
}

export async function deleteViewService(user: AuthUser, viewId: string) {
  const view = await prisma.savedView.findFirst({
    where: { id: viewId, organizationId: user.organizationId },
  });
  if (!view) throw new Error("Not found");
  if (view.userId !== user.id) requirePermission(user, "views.manage");
  await prisma.savedView.delete({ where: { id: viewId } });
}
