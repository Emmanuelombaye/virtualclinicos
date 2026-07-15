import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";
import { getEmailProvider } from "@/lib/infra/email";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function appUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}

const PasswordSchema = z.string().min(8).max(100);

/**
 * Always returns ok shape so callers cannot probe for emails.
 */
export async function requestPasswordResetService(emailRaw: string) {
  const email = z.string().email().parse(emailRaw.trim().toLowerCase());
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, organizationId: true },
  });
  const user = users.find((u) => u.email.toLowerCase() === email);

  if (user) {
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const link = `${appUrl()}/reset-password/${rawToken}`;
    await getEmailProvider().send({
      to: user.email,
      subject: "Reset your VirtualClinicOS password",
      text: `Hi ${user.name},\n\nReset your password (expires in 1 hour):\n${link}\n\nIf you did not request this, ignore this email.`,
    });

    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        actorUserId: user.id,
        action: "auth.password_reset_requested",
        entityType: "User",
        entityId: user.id,
      },
    });
  }

  return {
    ok: true as const,
    message:
      "If an account exists for that email, a reset link was sent (check server console in dev).",
  };
}

export async function resetPasswordWithTokenService(input: {
  token: string;
  password: string;
}) {
  const token = z.string().min(20).parse(input.token);
  const password = PasswordSchema.parse(input.password);

  const row = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash: hashToken(token),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });
  if (!row) throw new Error("Invalid or expired reset link");

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: row.userId, usedAt: null, id: { not: row.id } },
      data: { usedAt: new Date() },
    }),
  ]);

  await prisma.auditLog.create({
    data: {
      organizationId: row.user.organizationId,
      actorUserId: row.userId,
      action: "auth.password_reset_completed",
      entityType: "User",
      entityId: row.userId,
    },
  });

  return { ok: true as const };
}

export async function changePasswordService(
  user: AuthUser,
  input: { currentPassword: string; newPassword: string },
) {
  const currentPassword = z.string().min(1).parse(input.currentPassword);
  const newPassword = PasswordSchema.parse(input.newPassword);

  const row = await prisma.user.findUnique({ where: { id: user.id } });
  if (!row) throw new Error("Unauthorized");

  const ok = await bcrypt.compare(currentPassword, row.passwordHash);
  if (!ok) throw new Error("Invalid: current password is incorrect");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await writeAudit({
    user,
    action: "auth.password_changed",
    entityType: "User",
    entityId: user.id,
  });

  return { ok: true as const };
}

export async function peekResetToken(token: string) {
  const row = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash: hashToken(token),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: { select: { email: true } } },
  });
  return row;
}
