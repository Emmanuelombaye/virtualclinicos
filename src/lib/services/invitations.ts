import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";
import { getEmailProvider } from "@/lib/infra/email";
import { createSession } from "@/lib/auth/session";
import { createNotification } from "@/lib/services/notifications";
import { assertSeatAvailable } from "@/lib/services/billing";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function appUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}

export const CreateInvitationInput = z.object({
  email: z.string().email(),
  roleId: z.string().min(1),
  aeId: z.string().nullable().optional(),
});

export async function listInvitationsService(user: AuthUser) {
  requirePermission(user, "invitations.manage");
  return prisma.invitation.findMany({
    where: { organizationId: user.organizationId },
    include: {
      role: { select: { name: true, slug: true } },
      invitedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createInvitationService(
  user: AuthUser,
  input: z.infer<typeof CreateInvitationInput>,
) {
  requirePermission(user, "invitations.manage");
  const data = CreateInvitationInput.parse(input);
  const email = data.email.trim().toLowerCase();
  await assertSeatAvailable(user.organizationId);

  const role = await prisma.role.findFirst({
    where: { id: data.roleId, organizationId: user.organizationId },
  });
  if (!role) throw new Error("Not found");

  const existingUser = await prisma.user.findFirst({
    where: { organizationId: user.organizationId, email },
  });
  if (existingUser) throw new Error("User already exists");

  const rawToken = randomBytes(32).toString("hex");
  const invitation = await prisma.invitation.create({
    data: {
      organizationId: user.organizationId,
      email,
      roleId: role.id,
      aeId: data.aeId ?? null,
      tokenHash: hashToken(rawToken),
      invitedById: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const link = `${appUrl()}/invite/${rawToken}`;
  await getEmailProvider().send({
    to: email,
    subject: `Join ${user.organizationName} on VirtualClinicOS`,
    text: `${user.name} invited you to join ${user.organizationName} as ${role.name}.\n\nAccept: ${link}\n\nExpires in 7 days.`,
  });

  await writeAudit({
    user,
    action: "invitation.create",
    entityType: "Invitation",
    entityId: invitation.id,
    after: { email, roleId: role.id },
  });

  return { invitation, link };
}

export async function revokeInvitationService(
  user: AuthUser,
  invitationId: string,
) {
  requirePermission(user, "invitations.manage");
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, organizationId: user.organizationId },
  });
  if (!invitation) throw new Error("Not found");
  if (invitation.acceptedAt) throw new Error("Already accepted");

  const updated = await prisma.invitation.update({
    where: { id: invitation.id },
    data: { revokedAt: new Date() },
  });

  await writeAudit({
    user,
    action: "invitation.revoke",
    entityType: "Invitation",
    entityId: invitation.id,
  });

  return updated;
}

export async function getInvitationByToken(token: string) {
  const invitation = await prisma.invitation.findFirst({
    where: {
      tokenHash: hashToken(token),
      revokedAt: null,
      acceptedAt: null,
    },
    include: {
      organization: { select: { name: true } },
      role: { select: { name: true, slug: true } },
    },
  });
  if (!invitation) return null;
  if (invitation.expiresAt.getTime() < Date.now()) return null;
  return invitation;
}

export const AcceptInvitationInput = z.object({
  token: z.string().min(20),
  name: z.string().trim().min(2).max(120),
  password: z.string().min(6).max(100),
});

export async function acceptInvitationService(
  input: z.infer<typeof AcceptInvitationInput>,
) {
  const data = AcceptInvitationInput.parse(input);
  const invitation = await getInvitationByToken(data.token);
  if (!invitation) throw new Error("Invalid or expired invitation");

  const initials = data.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        organizationId: invitation.organizationId,
        roleId: invitation.roleId,
        email: invitation.email,
        name: data.name,
        initials,
        aeId: invitation.aeId,
        passwordHash,
      },
    });
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });
    return created;
  });

  await createSession(user.id);

  await createNotification({
    organizationId: invitation.organizationId,
    userId: invitation.invitedById,
    type: "invitation.accepted",
    title: "Invitation accepted",
    body: `${data.name} joined as ${invitation.role.name}`,
    href: "/settings/team",
  });

  return user;
}
