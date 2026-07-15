import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

export async function listPluginsService(user: AuthUser) {
  const plugins = await prisma.plugin.findMany({ orderBy: { name: "asc" } });
  const installs = await prisma.orgPluginInstall.findMany({
    where: { organizationId: user.organizationId },
  });
  const installed = new Set(installs.map((i) => i.pluginId));
  return plugins.map((p) => ({
    ...p,
    installed: installed.has(p.id),
  }));
}

export const InstallPluginInput = z.object({
  pluginId: z.string().min(1),
});

export async function installPluginService(
  user: AuthUser,
  input: z.infer<typeof InstallPluginInput>,
) {
  requirePermission(user, "settings.manage");
  const data = InstallPluginInput.parse(input);
  const plugin = await prisma.plugin.findUnique({ where: { id: data.pluginId } });
  if (!plugin) throw new Error("Not found");

  const install = await prisma.orgPluginInstall.upsert({
    where: {
      organizationId_pluginId: {
        organizationId: user.organizationId,
        pluginId: plugin.id,
      },
    },
    create: {
      organizationId: user.organizationId,
      pluginId: plugin.id,
      configJson: "{}",
    },
    update: {},
  });

  // Bootstrap related flag
  await prisma.featureFlag.upsert({
    where: {
      organizationId_key: {
        organizationId: user.organizationId,
        key: `plugin_${plugin.slug}`,
      },
    },
    create: {
      organizationId: user.organizationId,
      key: `plugin_${plugin.slug}`,
      enabled: true,
      description: `Plugin ${plugin.name} installed`,
    },
    update: { enabled: true },
  });

  await writeAudit({
    user,
    action: "plugin.install",
    entityType: "Plugin",
    entityId: plugin.id,
    after: { slug: plugin.slug },
  });
  return install;
}
