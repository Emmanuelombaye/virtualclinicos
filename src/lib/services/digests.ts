import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/services/notifications";
import {
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationPrefs,
} from "@/lib/services/profile";
import { getEmailProvider } from "@/lib/infra/email";

function parsePrefs(raw: string | null | undefined): NotificationPrefs {
  try {
    return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw ?? "{}") };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

function looksOverdueOrDueSoon(due: string) {
  const d = due.trim().toLowerCase();
  if (!d || d === "—" || d === "-") return false;
  if (/(overdue|today|asap)/i.test(d)) return true;
  const parsed = Date.parse(due);
  if (Number.isNaN(parsed)) return false;
  const days = (parsed - Date.now()) / (1000 * 60 * 60 * 24);
  return days <= 2;
}

/**
 * Daily-style digest of open / due-soon tasks per user who opted into digests.
 */
export async function runTaskDigestTick(organizationId?: string) {
  const users = await prisma.user.findMany({
    where: organizationId ? { organizationId } : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      organizationId: true,
      notificationPrefsJson: true,
    },
  });

  let notified = 0;
  for (const user of users) {
    const prefs = parsePrefs(user.notificationPrefsJson);
    if (!prefs.emailDigest && !prefs.inAppAll) continue;

    const tasks = await prisma.task.findMany({
      where: {
        organizationId: user.organizationId,
        deletedAt: null,
        status: { not: "Done" },
        OR: [
          { owner: { contains: user.name.split(" ")[0] ?? user.name } },
          { owner: user.name },
        ],
      },
      include: { client: { select: { name: true, id: true } } },
      take: 40,
    });

    const dueish = tasks.filter((t) => looksOverdueOrDueSoon(t.due));
    const focus = dueish.length ? dueish : tasks.slice(0, 5);
    if (!focus.length) continue;

    const lines = focus
      .map((t) => `• ${t.title} (${t.client.name}) — due ${t.due || "n/a"}`)
      .join("\n");
    const title = `Task digest: ${focus.length} open item${focus.length === 1 ? "" : "s"}`;
    const body = lines;

    if (prefs.inAppAll) {
      await createNotification({
        organizationId: user.organizationId,
        userId: user.id,
        type: "digest.tasks",
        title,
        body,
        href: "/tasks",
        sendEmail: false,
      });
    }

    if (prefs.emailDigest) {
      const org = await prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: { notificationSettingsJson: true },
      });
      let emailOn = true;
      try {
        const settings = JSON.parse(org?.notificationSettingsJson ?? "{}") as {
          email?: boolean;
        };
        emailOn = settings.email !== false;
      } catch {
        /* default */
      }
      if (emailOn) {
        await getEmailProvider().send({
          to: user.email,
          subject: title,
          text: `${body}\n\nOpen tasks: /tasks`,
        });
      }
    }

    notified += 1;
  }

  return { notified };
}
