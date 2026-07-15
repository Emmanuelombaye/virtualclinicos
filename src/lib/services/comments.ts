import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  hasPermission,
  requirePermission,
} from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";
import { writeActivity } from "@/lib/activity";
import { createNotification } from "@/lib/services/notifications";
import { assertClientAccess } from "@/lib/services/clients";

export const CreateCommentInput = z.object({
  entityType: z.enum(["Client", "Task", "Risk", "ClientGate", "Phase"]),
  entityId: z.string().min(1),
  clientId: z.number().int().positive().optional(),
  parentId: z.string().optional(),
  body: z.string().trim().min(1).max(5000),
});

function parseMentions(body: string): string[] {
  const matches = body.match(/@([A-Za-z][A-Za-z0-9._-]*)/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

export async function listCommentsService(
  user: AuthUser,
  entityType: string,
  entityId: string,
) {
  return prisma.comment.findMany({
    where: {
      organizationId: user.organizationId,
      entityType,
      entityId,
      deletedAt: null,
      parentId: null,
    },
    include: {
      author: { select: { id: true, name: true, initials: true } },
      reactions: {
        include: { user: { select: { id: true, name: true } } },
      },
      replies: {
        where: { deletedAt: null },
        include: {
          author: { select: { id: true, name: true, initials: true } },
          reactions: true,
        },
        orderBy: { createdAt: "asc" },
      },
      files: { where: { deletedAt: null } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCommentService(
  user: AuthUser,
  input: z.infer<typeof CreateCommentInput>,
) {
  requirePermission(user, "comments.create");
  const data = CreateCommentInput.parse(input);

  let clientId = data.clientId ?? null;
  if (data.entityType === "Client") {
    clientId = Number(data.entityId);
    await assertClientAccess(user, clientId);
  } else if (clientId) {
    await assertClientAccess(user, clientId);
  }

  if (data.parentId) {
    const parent = await prisma.comment.findFirst({
      where: {
        id: data.parentId,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });
    if (!parent) throw new Error("Not found");
  }

  const comment = await prisma.comment.create({
    data: {
      organizationId: user.organizationId,
      authorId: user.id,
      entityType: data.entityType,
      entityId: data.entityId,
      clientId,
      parentId: data.parentId ?? null,
      body: data.body,
    },
  });

  await writeAudit({
    user,
    action: "comment.create",
    entityType: "Comment",
    entityId: comment.id,
    after: { entityType: data.entityType, entityId: data.entityId },
  });
  await writeActivity({
    user,
    action: "comment.create",
    entityType: data.entityType,
    entityId: data.entityId,
    clientId,
    summary: `${user.name} commented: ${data.body.slice(0, 80)}`,
  });

  const mentionTokens = parseMentions(data.body);
  if (mentionTokens.length) {
    const orgUsers = await prisma.user.findMany({
      where: { organizationId: user.organizationId },
    });
    for (const u of orgUsers) {
      const key = u.name.toLowerCase().replace(/\s+/g, "");
      const first = u.name.split(/\s+/)[0]?.toLowerCase() ?? "";
      const matched = mentionTokens.some(
        (t) =>
          t === first ||
          t === key ||
          u.name.toLowerCase().includes(t) ||
          u.email.toLowerCase().startsWith(t),
      );
      if (!matched || u.id === user.id) continue;
      await createNotification({
        organizationId: user.organizationId,
        userId: u.id,
        type: "comment.mention",
        title: `${user.name} mentioned you`,
        body: data.body.slice(0, 140),
        href: clientId ? `/clients/${clientId}` : "/command-center",
        emailTo: u.email,
        sendEmail: true,
      });
    }
  }

  return comment;
}

export async function deleteCommentService(user: AuthUser, commentId: string) {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, organizationId: user.organizationId },
  });
  if (!comment || comment.deletedAt) throw new Error("Not found");

  const canModerate = hasPermission(user, "comments.moderate");
  if (comment.authorId !== user.id && !canModerate) {
    throw new Error("Forbidden");
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { deletedAt: new Date(), deletedById: user.id },
  });

  await writeAudit({
    user,
    action: "comment.delete",
    entityType: "Comment",
    entityId: commentId,
  });

  return updated;
}

export async function toggleReactionService(
  user: AuthUser,
  input: { commentId: string; emoji: string },
) {
  requirePermission(user, "comments.create");
  const emoji = z.string().min(1).max(8).parse(input.emoji);
  const comment = await prisma.comment.findFirst({
    where: {
      id: input.commentId,
      organizationId: user.organizationId,
      deletedAt: null,
    },
  });
  if (!comment) throw new Error("Not found");

  const existing = await prisma.commentReaction.findUnique({
    where: {
      commentId_userId_emoji: {
        commentId: comment.id,
        userId: user.id,
        emoji,
      },
    },
  });

  if (existing) {
    await prisma.commentReaction.delete({ where: { id: existing.id } });
    return { removed: true as const };
  }

  await prisma.commentReaction.create({
    data: { commentId: comment.id, userId: user.id, emoji },
  });
  return { removed: false as const };
}
