import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/auth/users";
import { getEmailProvider } from "@/lib/infra/email";
import { getUserNotificationPrefs } from "@/lib/services/profile";

export async function createNotification(input: {
  organizationId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  href?: string | null;
  emailTo?: string | null;
  sendEmail?: boolean;
}) {
  const { prefs, email: userEmail } = await getUserNotificationPrefs(
    input.userId,
  );
  if (!prefs.inAppAll) {
    return null;
  }

  const notification = await prisma.notification.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
    },
  });

  const wantsEmail =
    input.sendEmail &&
    (input.type.includes("mention")
      ? prefs.emailMentions
      : input.type.includes("assign")
        ? prefs.emailAssignments
        : prefs.emailDigest || prefs.emailMentions || prefs.emailAssignments);

  if (wantsEmail) {
    const org = await prisma.organization.findUnique({
      where: { id: input.organizationId },
      select: { notificationSettingsJson: true },
    });
    let emailOn = true;
    try {
      const settings = JSON.parse(org?.notificationSettingsJson ?? "{}") as {
        email?: boolean;
      };
      emailOn = settings.email !== false;
    } catch {
      /* keep default */
    }
    const to = input.emailTo ?? userEmail;
    if (emailOn && to) {
      await getEmailProvider().send({
        to,
        subject: input.title,
        text: `${input.body}${input.href ? `\n\n${input.href}` : ""}`,
      });
    }
  }

  return notification;
}

export async function listNotifications(user: AuthUser, limit = 40) {
  return prisma.notification.findMany({
    where: {
      organizationId: user.organizationId,
      userId: user.id,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markNotificationsRead(
  user: AuthUser,
  ids?: string[],
) {
  await prisma.notification.updateMany({
    where: {
      organizationId: user.organizationId,
      userId: user.id,
      readAt: null,
      ...(ids?.length ? { id: { in: ids } } : {}),
    },
    data: { readAt: new Date() },
  });
}

export async function unreadNotificationCount(user: AuthUser) {
  return prisma.notification.count({
    where: {
      organizationId: user.organizationId,
      userId: user.id,
      readAt: null,
    },
  });
}
