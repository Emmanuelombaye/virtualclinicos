import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  hasPermission,
  requirePermission,
} from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";
import { writeActivity } from "@/lib/activity";
import { getStorageProvider } from "@/lib/infra/storage";
import { assertClientAccess } from "@/lib/services/clients";

export const UploadMetaSchema = z.object({
  name: z.string().min(1).max(240),
  mimeType: z.string().min(1).max(120),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  clientId: z.number().int().positive().optional(),
  commentId: z.string().optional(),
});

export async function uploadFileService(
  user: AuthUser,
  file: { name: string; mimeType: string; body: Buffer },
  meta: z.infer<typeof UploadMetaSchema>,
) {
  requirePermission(user, "files.upload");
  const data = UploadMetaSchema.parse({ ...meta, name: file.name, mimeType: file.mimeType });

  if (data.clientId) {
    await assertClientAccess(user, data.clientId);
  }

  if (file.body.byteLength > 15 * 1024 * 1024) {
    throw new Error("File too large (max 15MB)");
  }

  const storage = getStorageProvider();
  const stored = await storage.put({
    organizationId: user.organizationId,
    filename: data.name,
    mimeType: data.mimeType,
    body: file.body,
  });

  const row = await prisma.fileObject.create({
    data: {
      organizationId: user.organizationId,
      uploadedById: user.id,
      name: data.name,
      mimeType: data.mimeType,
      sizeBytes: stored.sizeBytes,
      storageKey: stored.storageKey,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
      clientId: data.clientId ?? null,
      commentId: data.commentId ?? null,
    },
  });

  await writeAudit({
    user,
    action: "file.upload",
    entityType: "FileObject",
    entityId: row.id,
    after: { name: row.name, sizeBytes: row.sizeBytes },
  });
  if (data.clientId) {
    await writeActivity({
      user,
      action: "file.upload",
      entityType: "FileObject",
      entityId: row.id,
      clientId: data.clientId,
      summary: `${user.name} uploaded ${row.name}`,
    });
  }

  return row;
}

export async function listFilesService(
  user: AuthUser,
  filter?: { clientId?: number; entityType?: string; entityId?: string },
) {
  if (filter?.clientId) await assertClientAccess(user, filter.clientId);
  return prisma.fileObject.findMany({
    where: {
      organizationId: user.organizationId,
      deletedAt: null,
      ...(filter?.clientId ? { clientId: filter.clientId } : {}),
      ...(filter?.entityType ? { entityType: filter.entityType } : {}),
      ...(filter?.entityId ? { entityId: filter.entityId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function softDeleteFileService(user: AuthUser, fileId: string) {
  const file = await prisma.fileObject.findFirst({
    where: { id: fileId, organizationId: user.organizationId, deletedAt: null },
  });
  if (!file) throw new Error("Not found");

  const canManage = hasPermission(user, "files.manage");
  if (file.uploadedById !== user.id && !canManage) {
    throw new Error("Forbidden");
  }

  const updated = await prisma.fileObject.update({
    where: { id: fileId },
    data: { deletedAt: new Date(), deletedById: user.id },
  });

  await writeAudit({
    user,
    action: "file.delete",
    entityType: "FileObject",
    entityId: fileId,
  });

  return updated;
}

export async function getFileForDownload(user: AuthUser, fileId: string) {
  const file = await prisma.fileObject.findFirst({
    where: { id: fileId, organizationId: user.organizationId, deletedAt: null },
  });
  if (!file) throw new Error("Not found");
  if (file.clientId) await assertClientAccess(user, file.clientId);
  return file;
}
