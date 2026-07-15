import { z } from "zod";
import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";

export type NotificationPrefs = {
  emailMentions: boolean;
  emailAssignments: boolean;
  emailDigest: boolean;
  inAppAll: boolean;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  emailMentions: true,
  emailAssignments: true,
  emailDigest: true,
  inAppAll: true,
};

export type OnboardingState = {
  dismissedWelcome: boolean;
  completedSteps: string[];
};

const DEFAULT_ONBOARDING: OnboardingState = {
  dismissedWelcome: false,
  completedSteps: [],
};

function parsePrefs(raw: string | null | undefined): NotificationPrefs {
  try {
    const j = JSON.parse(raw ?? "{}") as Partial<NotificationPrefs>;
    return { ...DEFAULT_NOTIFICATION_PREFS, ...j };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

function parseOnboarding(raw: string | null | undefined): OnboardingState {
  try {
    const j = JSON.parse(raw ?? "{}") as Partial<OnboardingState>;
    return {
      dismissedWelcome: Boolean(j.dismissedWelcome),
      completedSteps: Array.isArray(j.completedSteps) ? j.completedSteps : [],
    };
  } catch {
    return { ...DEFAULT_ONBOARDING };
  }
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export async function getProfileService(user: AuthUser) {
  const row = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      initials: true,
      timezone: true,
      notificationPrefsJson: true,
      onboardingJson: true,
      mfaEnabled: true,
      role: { select: { name: true, slug: true } },
    },
  });
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    initials: row.initials,
    timezone: row.timezone,
    mfaEnabled: row.mfaEnabled,
    roleName: row.role.name,
    roleSlug: row.role.slug,
    prefs: parsePrefs(row.notificationPrefsJson),
    onboarding: parseOnboarding(row.onboardingJson),
  };
}

const UpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
  prefs: z
    .object({
      emailMentions: z.boolean().optional(),
      emailAssignments: z.boolean().optional(),
      emailDigest: z.boolean().optional(),
      inAppAll: z.boolean().optional(),
    })
    .optional(),
});

export async function updateProfileService(
  user: AuthUser,
  input: z.infer<typeof UpdateSchema>,
) {
  const data = UpdateSchema.parse(input);
  const current = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { notificationPrefsJson: true, name: true },
  });

  const prefs = {
    ...parsePrefs(current.notificationPrefsJson),
    ...(data.prefs ?? {}),
  };

  const name = data.name ?? current.name;
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(data.name
        ? { name: data.name, initials: initialsFromName(data.name) }
        : {}),
      ...(data.timezone ? { timezone: data.timezone } : {}),
      notificationPrefsJson: JSON.stringify(prefs),
    },
    select: {
      id: true,
      email: true,
      name: true,
      initials: true,
      timezone: true,
      notificationPrefsJson: true,
    },
  });

  await writeAudit({
    user,
    action: "user.profile_updated",
    entityType: "User",
    entityId: user.id,
  });

  return {
    ...updated,
    prefs: parsePrefs(updated.notificationPrefsJson),
  };
}

export async function getUserNotificationPrefs(userId: string) {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPrefsJson: true, email: true },
  });
  return {
    email: row?.email ?? null,
    prefs: parsePrefs(row?.notificationPrefsJson),
  };
}

export async function dismissWelcomeService(user: AuthUser) {
  const row = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { onboardingJson: true },
  });
  const onboarding = {
    ...parseOnboarding(row.onboardingJson),
    dismissedWelcome: true,
  };
  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingJson: JSON.stringify(onboarding) },
  });
  return onboarding;
}

export async function completeOnboardingStepService(
  user: AuthUser,
  step: string,
) {
  const key = z.string().min(1).max(40).parse(step);
  const row = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { onboardingJson: true },
  });
  const onboarding = parseOnboarding(row.onboardingJson);
  if (!onboarding.completedSteps.includes(key)) {
    onboarding.completedSteps.push(key);
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingJson: JSON.stringify(onboarding) },
  });
  return onboarding;
}

export async function getOnboardingChecklist(user: AuthUser) {
  const profile = await getProfileService(user);
  if (profile.onboarding.dismissedWelcome) {
    return { show: false as const, steps: [], completed: [] as string[] };
  }

  const [clients, pendingInvites, openTasks, automations] = await Promise.all([
    prisma.client.count({
      where: { organizationId: user.organizationId, deletedAt: null },
    }),
    prisma.invitation.count({
      where: {
        organizationId: user.organizationId,
        acceptedAt: null,
        revokedAt: null,
      },
    }),
    prisma.task.count({
      where: {
        organizationId: user.organizationId,
        deletedAt: null,
        status: { not: "Done" },
      },
    }),
    prisma.automationRule.count({
      where: { organizationId: user.organizationId, enabled: true },
    }),
  ]);

  const steps = [
    {
      id: "invite",
      label: "Invite your team",
      href: "/settings/team",
      done:
        pendingInvites > 0 ||
        profile.onboarding.completedSteps.includes("invite"),
    },
    {
      id: "client",
      label: "Create your first client",
      href: "/clients",
      done: clients > 0 || profile.onboarding.completedSteps.includes("client"),
    },
    {
      id: "tasks",
      label: "Track open delivery tasks",
      href: "/tasks",
      done: openTasks > 0 || profile.onboarding.completedSteps.includes("tasks"),
    },
    {
      id: "automations",
      label: "Turn on an automation",
      href: "/settings/automations",
      done:
        automations > 0 ||
        profile.onboarding.completedSteps.includes("automations"),
    },
    {
      id: "profile",
      label: "Set your profile & alert prefs",
      href: "/settings/profile",
      done: profile.onboarding.completedSteps.includes("profile"),
    },
  ];

  if (steps.every((s) => s.done)) {
    return { show: false as const, steps: [], completed: profile.onboarding.completedSteps };
  }

  return {
    show: true as const,
    steps,
    completed: profile.onboarding.completedSteps,
  };
}
