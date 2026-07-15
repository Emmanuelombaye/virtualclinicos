import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { GATE_CATALOG } from "../src/lib/constants";
import {
  SYSTEM_ROLE_PERMISSIONS,
  SYSTEM_ROLES,
} from "../src/lib/auth/permissions-catalog";
import {
  ACCOUNT_EXECUTIVES,
  CLIENTS,
  COMMS,
  FOLLOW_UPS,
  RISKS,
  TASKS,
} from "../src/lib/seed";
import { gateStatusFor } from "../src/lib/status-engine";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "demo";

async function main() {
  await prisma.webhookDelivery.deleteMany();
  await prisma.webhookEndpoint.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.apiUsageDaily.deleteMany();
  await prisma.orgPluginInstall.deleteMany();
  await prisma.plugin.deleteMany();
  await prisma.entityRevision.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.featureFlag.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.dashboardLayout.deleteMany();
  await prisma.aeAvailability.deleteMany();
  await prisma.recurringTaskRule.deleteMany();
  await prisma.customFieldValue.deleteMany();
  await prisma.customFieldDef.deleteMany();
  await prisma.savedView.deleteMany();
  await prisma.launchTemplateGate.deleteMany();
  await prisma.launchTemplate.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.commentReaction.deleteMany();
  await prisma.fileObject.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.activityEvent.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.comm.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.task.deleteMany();
  await prisma.clientGate.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.accountExecutive.deleteMany();
  await prisma.organization.deleteMany();

  const org = await prisma.organization.create({
    data: {
      name: "VirtualClinicOS Demo",
      slug: "vco-demo",
      timezone: "America/New_York",
      country: "US",
      primaryColor: "#2E5BFF",
      fiscalYearStartMonth: 1,
    },
  });

  const roleBySlug: Record<string, string> = {};
  for (const def of SYSTEM_ROLES) {
    const role = await prisma.role.create({
      data: {
        organizationId: org.id,
        name: def.name,
        slug: def.slug,
        isSystem: true,
        permissions: {
          create: (SYSTEM_ROLE_PERMISSIONS[def.slug] ?? []).map(
            (permission) => ({ permission }),
          ),
        },
      },
    });
    roleBySlug[def.slug] = role.id;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const demoUsers = [
    {
      email: "alex@virtualclinicos.com",
      name: "Alex Rivera",
      initials: "AR",
      role: "ceo",
      aeId: null as string | null,
    },
    {
      email: "maya@virtualclinicos.com",
      name: "Maya Chen",
      initials: "MC",
      role: "ae",
      aeId: "maya",
    },
    {
      email: "devon@virtualclinicos.com",
      name: "Devon Ray",
      initials: "DR",
      role: "ae",
      aeId: "devon",
    },
    {
      email: "priya@virtualclinicos.com",
      name: "Priya Nair",
      initials: "PN",
      role: "ae",
      aeId: "priya",
    },
    {
      email: "viewer@virtualclinicos.com",
      name: "Vera View",
      initials: "VV",
      role: "viewer",
      aeId: null as string | null,
    },
  ];

  for (const u of demoUsers) {
    await prisma.user.create({
      data: {
        organizationId: org.id,
        roleId: roleBySlug[u.role]!,
        email: u.email,
        name: u.name,
        initials: u.initials,
        aeId: u.aeId,
        passwordHash,
      },
    });
  }

  for (const ae of Object.values(ACCOUNT_EXECUTIVES)) {
    await prisma.accountExecutive.create({
      data: {
        organizationId: org.id,
        id: ae.id,
        name: ae.name,
        initials: ae.initials,
        capacityLoad: ae.capacityLoad,
      },
    });
  }

  for (const client of CLIENTS) {
    await prisma.client.create({
      data: {
        id: client.id,
        organizationId: org.id,
        name: client.name,
        aeId: client.aeId,
        phase: client.phase,
        status: client.status,
        health: client.health,
        daysToLaunch: client.daysToLaunch,
        mrr: client.mrr,
        waitingOn: client.waitingOn,
        waitDays: client.waitDays,
        criticalOverdue: client.criticalOverdue,
        gates: {
          create: GATE_CATALOG.map((g) => ({
            organizationId: org.id,
            name: g.name,
            phase: g.phase,
            critical: g.critical,
            ownerType: g.ownerType,
            status: gateStatusFor(client, g.phase),
          })),
        },
      },
    });
  }

  for (const task of TASKS) {
    await prisma.task.create({
      data: {
        id: task.id,
        organizationId: org.id,
        clientId: task.clientId,
        title: task.title,
        priority: task.priority,
        status: task.status,
        owner: task.owner,
        due: task.due,
      },
    });
  }

  for (const risk of RISKS) {
    await prisma.risk.create({
      data: {
        id: risk.id,
        organizationId: org.id,
        clientId: risk.clientId,
        title: risk.title,
        type: risk.type,
        severity: risk.severity,
        status: risk.status,
      },
    });
  }

  for (const comm of COMMS) {
    await prisma.comm.create({
      data: {
        id: comm.id,
        organizationId: org.id,
        clientId: comm.clientId,
        subject: comm.subject,
        channel: comm.channel,
        whenLabel: comm.when,
      },
    });
  }

  for (const followUp of FOLLOW_UPS) {
    await prisma.followUp.create({
      data: {
        id: followUp.id,
        organizationId: org.id,
        clientId: followUp.clientId,
        note: followUp.note,
        due: followUp.due,
        tone: followUp.tone,
      },
    });
  }

  const alex = await prisma.user.findFirst({
    where: { email: "alex@virtualclinicos.com" },
  });
  if (alex) {
    await prisma.activityEvent.create({
      data: {
        organizationId: org.id,
        actorUserId: alex.id,
        clientId: 1,
        entityType: "Organization",
        entityId: org.id,
        action: "org.seeded",
        summary: "Organization seeded with demo delivery data",
      },
    });
  }

  // Phase 2–5 seed extras
  const templateDefs = [
    { name: "Dental", slug: "dental", description: "Dental clinic launch" },
    { name: "Telehealth", slug: "telehealth", description: "Virtual care launch" },
    { name: "Primary Care", slug: "primary-care", description: "Primary care rollout" },
    { name: "Hospital", slug: "hospital", description: "Hospital system launch" },
    { name: "Specialist", slug: "specialist", description: "Specialty practice launch" },
  ];
  for (const t of templateDefs) {
    await prisma.launchTemplate.create({
      data: {
        organizationId: org.id,
        name: t.name,
        slug: t.slug,
        description: t.description,
        defaultMrr: 5000,
        daysToLaunch: 75,
        gates: {
          create: GATE_CATALOG.slice(0, 6).map((g, i) => ({
            name: g.name,
            phase: g.phase,
            critical: g.critical,
            ownerType: g.ownerType,
            sortOrder: i,
          })),
        },
      },
    });
  }

  await prisma.automationRule.createMany({
    data: [
      {
        organizationId: org.id,
        name: "Gate Complete → follow-up task",
        trigger: "gate.complete",
        conditionsJson: "{}",
        actionsJson: JSON.stringify([
          {
            type: "create_task",
            title: "Confirm gate completion with client",
            priority: "High",
            owner: "AE",
          },
          {
            type: "notify",
            roleSlugs: ["ae"],
            title: "Gate completed",
            body: "A launch gate was marked complete",
          },
        ]),
        enabled: true,
      },
      {
        organizationId: org.id,
        name: "Critical risk → alert",
        trigger: "risk.critical",
        conditionsJson: "{}",
        actionsJson: JSON.stringify([
          {
            type: "notify",
            roleSlugs: ["ceo", "superadmin"],
            title: "Critical risk",
            body: "A critical risk was opened",
          },
          { type: "activity", summary: "Automation notified leaders of critical risk" },
        ]),
        enabled: true,
      },
    ],
  });

  for (const [key, enabled, description] of [
    ["calendar", true, "Calendar / milestones"],
    ["automations", true, "Automation engine"],
    ["ai_assistant", true, "AI launch assistant"],
  ] as const) {
    await prisma.featureFlag.create({
      data: {
        organizationId: org.id,
        key,
        enabled,
        description,
      },
    });
  }

  await prisma.subscription.create({
    data: {
      organizationId: org.id,
      plan: "pro",
      status: "active",
      seats: 25,
    },
  });

  const plugins = [
    { slug: "slack", name: "Slack", description: "Post launch alerts to Slack" },
    { slug: "hubspot", name: "HubSpot", description: "Sync clients to HubSpot" },
    { slug: "zapier", name: "Zapier", description: "Trigger Zaps on delivery events" },
  ];
  for (const p of plugins) {
    await prisma.plugin.upsert({
      where: { slug: p.slug },
      create: p,
      update: { name: p.name, description: p.description },
    });
  }

  if (alex) {
    await prisma.savedView.createMany({
      data: [
        {
          organizationId: org.id,
          userId: alex.id,
          name: "Delayed Launches",
          entity: "Client",
          filterJson: JSON.stringify({ daysToLaunch: { lte: 14 }, health: "red" }),
          isShared: true,
        },
        {
          organizationId: org.id,
          userId: alex.id,
          name: "High Risk",
          entity: "Client",
          filterJson: JSON.stringify({ health: "red" }),
          isShared: true,
        },
        {
          organizationId: org.id,
          userId: alex.id,
          name: "Enterprise Clients",
          entity: "Client",
          filterJson: JSON.stringify({ mrr: { gte: 10000 } }),
          isShared: true,
        },
      ],
    });
  }

  await prisma.customFieldDef.createMany({
    data: [
      {
        organizationId: org.id,
        entityType: "Client",
        key: "emr_vendor",
        label: "EMR Vendor",
        fieldType: "text",
      },
      {
        organizationId: org.id,
        entityType: "Client",
        key: "go_live_window",
        label: "Go-live window",
        fieldType: "text",
      },
      {
        organizationId: org.id,
        entityType: "Client",
        key: "region",
        label: "Region",
        fieldType: "select",
        optionsJson: JSON.stringify(["US-East", "US-West", "EU"]),
      },
    ],
  });

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      emailFromName: "VirtualClinicOS",
      supportEmail: "support@virtualclinicos.com",
      plan: "pro",
      apiRateLimitPerMinute: 120,
    },
  });

  console.log(
    `Seeded org "${org.slug}", roles=${SYSTEM_ROLES.length}, users=${demoUsers.length}, clients=${CLIENTS.length}, templates=5 (password: ${DEMO_PASSWORD})`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
