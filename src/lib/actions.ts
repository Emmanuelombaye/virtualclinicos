"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import {
  createClientService,
  updateClientWaitingService,
} from "@/lib/services/clients";
import { updateGateStatusService } from "@/lib/services/gates";
import { createTaskService, updateTaskStatusService } from "@/lib/services/tasks";
import {
  createCommService,
  updateRiskStatusService,
} from "@/lib/services/risks";
import { updateOrganizationService } from "@/lib/services/organization";
import {
  acceptInvitationService,
  createInvitationService,
  revokeInvitationService,
} from "@/lib/services/invitations";
import {
  createCommentService,
  deleteCommentService,
  toggleReactionService,
} from "@/lib/services/comments";
import {
  markNotificationsRead,
} from "@/lib/services/notifications";
import { updateRolePermissionsService } from "@/lib/services/organization";
import type { z } from "zod";
import { GateStatusSchema } from "@/lib/services/gates";
import { TaskStatusSchema } from "@/lib/services/tasks";
import { WaitingOnSchema } from "@/lib/services/clients";
import { RiskStatusSchema } from "@/lib/services/risks";

function revalidateClientSurfaces(clientId?: number) {
  revalidatePath("/command-center");
  revalidatePath("/clients");
  revalidatePath("/projects");
  revalidatePath("/deliverables");
  revalidatePath("/tasks");
  revalidatePath("/ae-dashboard");
  revalidatePath("/audit");
  revalidatePath("/notifications");
  revalidatePath("/settings/organization");
  revalidatePath("/settings/team");
  revalidatePath("/settings/roles");
  if (clientId) revalidatePath(`/clients/${clientId}`);
}

export async function updateGateStatus(input: {
  gateId: string;
  status: z.infer<typeof GateStatusSchema>;
}) {
  const user = await requireUser();
  const gate = await updateGateStatusService(user, input);
  revalidateClientSurfaces(gate.clientId);
  return { ok: true as const };
}

export async function updateTaskStatus(input: {
  taskId: string;
  status: z.infer<typeof TaskStatusSchema>;
}) {
  const user = await requireUser();
  const task = await updateTaskStatusService(user, input);
  revalidateClientSurfaces(task.clientId);
  return { ok: true as const };
}

export async function updateClientWaiting(input: {
  clientId: number;
  waitingOn: z.infer<typeof WaitingOnSchema>;
  waitDays: number;
}) {
  const user = await requireUser();
  const client = await updateClientWaitingService(user, input);
  revalidateClientSurfaces(client.id);
  return { ok: true as const };
}

export async function createTask(input: {
  clientId: number;
  title: string;
  priority: "Urgent" | "High" | "Medium" | "Low";
  owner: string;
  due: string;
}) {
  const user = await requireUser();
  const task = await createTaskService(user, input);
  revalidateClientSurfaces(task.clientId);
  return { ok: true as const, id: task.id };
}

export async function createClient(input: {
  name: string;
  aeId: "maya" | "devon" | "priya";
  mrr?: number;
}) {
  const user = await requireUser();
  const client = await createClientService(user, input);
  revalidateClientSurfaces(client.id);
  return { ok: true as const, id: client.id };
}

export async function createComm(input: {
  clientId: number;
  subject: string;
  channel: "Email" | "Call" | "Slack";
  whenLabel?: string;
}) {
  const user = await requireUser();
  const comm = await createCommService(user, input);
  revalidateClientSurfaces(comm.clientId);
  return { ok: true as const, id: comm.id };
}

export async function updateRiskStatus(input: {
  riskId: string;
  status: z.infer<typeof RiskStatusSchema>;
}) {
  const user = await requireUser();
  const risk = await updateRiskStatusService(user, input);
  revalidateClientSurfaces(risk.clientId);
  return { ok: true as const };
}

export async function updateOrgSettingsAction(input: {
  name?: string;
  primaryColor?: string | null;
  domain?: string | null;
  timezone?: string;
  country?: string;
  fiscalYearStartMonth?: number;
  notificationSettingsJson?: string;
  logoFileId?: string | null;
}) {
  const user = await requireUser();
  await updateOrganizationService(user, input);
  revalidateClientSurfaces();
  return { ok: true as const };
}

export async function createInvitationAction(input: {
  email: string;
  roleId: string;
  aeId?: string | null;
}) {
  const user = await requireUser();
  const result = await createInvitationService(user, input);
  revalidatePath("/settings/team");
  return { ok: true as const, link: result.link };
}

export async function revokeInvitationAction(invitationId: string) {
  const user = await requireUser();
  await revokeInvitationService(user, invitationId);
  revalidatePath("/settings/team");
  return { ok: true as const };
}

export async function acceptInvitationAction(input: {
  token: string;
  name: string;
  password: string;
}) {
  const user = await acceptInvitationService(input);
  return { ok: true as const, role: user.roleId };
}

export async function createCommentAction(input: {
  entityType: "Client" | "Task" | "Risk" | "ClientGate" | "Phase";
  entityId: string;
  clientId?: number;
  parentId?: string;
  body: string;
}) {
  const user = await requireUser();
  const comment = await createCommentService(user, input);
  if (input.clientId) revalidatePath(`/clients/${input.clientId}`);
  revalidatePath("/notifications");
  return { ok: true as const, id: comment.id };
}

export async function deleteCommentAction(commentId: string, clientId?: number) {
  const user = await requireUser();
  await deleteCommentService(user, commentId);
  if (clientId) revalidatePath(`/clients/${clientId}`);
  return { ok: true as const };
}

export async function toggleReactionAction(input: {
  commentId: string;
  emoji: string;
  clientId?: number;
}) {
  const user = await requireUser();
  await toggleReactionService(user, input);
  if (input.clientId) revalidatePath(`/clients/${input.clientId}`);
  return { ok: true as const };
}

export async function markNotificationsReadAction(ids?: string[]) {
  const user = await requireUser();
  await markNotificationsRead(user, ids);
  revalidatePath("/notifications");
  return { ok: true as const };
}

export async function updateRolePermissionsAction(input: {
  roleId: string;
  permissions: string[];
}) {
  const user = await requireUser();
  await updateRolePermissionsService(user, input);
  revalidatePath("/settings/roles");
  return { ok: true as const };
}
