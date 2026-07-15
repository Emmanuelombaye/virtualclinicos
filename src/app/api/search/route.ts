import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuth } from "@/lib/auth/api-key";
import {
  clientVisibilityWhere,
  hasPermission,
} from "@/lib/auth/permissions";

export async function GET(req: NextRequest) {
  let user;
  try {
    user = await resolveAuth(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({
      clients: [],
      tasks: [],
      risks: [],
      users: [],
      files: [],
    });
  }

  const [clients, tasks, risks, files] = await Promise.all([
    prisma.client.findMany({
      where: {
        AND: [clientVisibilityWhere(user), { name: { contains: q } }],
      },
      select: { id: true, name: true, phase: true, health: true },
      take: 8,
      orderBy: { name: "asc" },
    }),
    prisma.task.findMany({
      where: {
        organizationId: user.organizationId,
        title: { contains: q },
        client: clientVisibilityWhere(user),
      },
      select: {
        id: true,
        title: true,
        status: true,
        clientId: true,
        client: { select: { name: true } },
      },
      take: 8,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.risk.findMany({
      where: {
        organizationId: user.organizationId,
        title: { contains: q },
        client: clientVisibilityWhere(user),
      },
      select: {
        id: true,
        title: true,
        severity: true,
        clientId: true,
        client: { select: { name: true } },
      },
      take: 6,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.fileObject.findMany({
      where: {
        organizationId: user.organizationId,
        deletedAt: null,
        name: { contains: q },
      },
      select: { id: true, name: true, mimeType: true, clientId: true },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  let users: { id: string; name: string; email: string; role: string }[] = [];
  if (hasPermission(user, "users.manage") || hasPermission(user, "invitations.manage")) {
    const rows = await prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
        ],
      },
      include: { role: { select: { name: true } } },
      take: 6,
    });
    users = rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role.name,
    }));
  }

  return NextResponse.json({
    clients,
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      clientId: t.clientId,
      clientName: t.client.name,
    })),
    risks: risks.map((r) => ({
      id: r.id,
      title: r.title,
      severity: r.severity,
      clientId: r.clientId,
      clientName: r.client.name,
    })),
    users,
    files,
  });
}
