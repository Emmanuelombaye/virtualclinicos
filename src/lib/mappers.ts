import type {
  AccountExecutive,
  AeId,
  Client,
  ClientStatus,
  Comm,
  DerivedClient,
  DerivedGate,
  FollowUp,
  GateStatus,
  Health,
  OwnerType,
  PhaseId,
  Risk,
  RiskSeverity,
  RiskStatus,
  RiskType,
  Task,
  TaskPriority,
  TaskStatus,
  WaitingOn,
} from "./types";
import { PHASE_BY_ID } from "./constants";
import { launchLabel, phaseLabel } from "./status-engine";

type AeRow = {
  id: string;
  name: string;
  initials: string;
  capacityLoad: number;
};

type GateRow = {
  id: string;
  name: string;
  phase: number;
  critical: boolean;
  ownerType: string;
  status: string;
};

type ClientRow = {
  id: number;
  name: string;
  aeId: string;
  phase: number;
  status: string;
  health: string;
  daysToLaunch: number;
  mrr: number;
  waitingOn: string;
  waitDays: number;
  criticalOverdue: number;
  ae: AeRow;
  gates: GateRow[];
  tasks?: { status: string }[];
};

export function mapAe(row: AeRow): AccountExecutive {
  return {
    id: row.id as AeId,
    name: row.name,
    initials: row.initials,
    capacityLoad: row.capacityLoad,
  };
}

export function mapGate(row: GateRow): DerivedGate & { id: string } {
  return {
    id: row.id,
    name: row.name,
    phase: row.phase as PhaseId,
    critical: row.critical,
    ownerType: row.ownerType as OwnerType,
    status: row.status as GateStatus,
  };
}

export function mapClient(row: ClientRow): DerivedClient {
  const gates = row.gates.map(mapGate);
  const complete = gates.filter((g) => g.status === "Complete").length;
  const completion = Math.round((complete / Math.max(gates.length, 1)) * 100);
  const openTaskCount = (row.tasks ?? []).filter((t) => t.status !== "Done")
    .length;

  const client: Client = {
    id: row.id,
    name: row.name,
    aeId: row.aeId as AeId,
    phase: row.phase as PhaseId,
    status: row.status as ClientStatus,
    health: row.health as Health,
    daysToLaunch: row.daysToLaunch,
    mrr: row.mrr,
    waitingOn: row.waitingOn as WaitingOn,
    waitDays: row.waitDays,
    criticalOverdue: row.criticalOverdue,
  };

  return {
    ...client,
    ae: mapAe(row.ae),
    completion,
    phaseLabel: phaseLabel(client),
    launchLabel: launchLabel(client),
    openTaskCount,
    gates,
    deliverablesLeft: gates.filter((g) => g.status !== "Complete").length,
    criticalLeft: gates.filter((g) => g.critical && g.status !== "Complete")
      .length,
  };
}

export function mapTask(row: {
  id: string;
  clientId: number;
  title: string;
  priority: string;
  status: string;
  owner: string;
  due: string;
}): Task {
  return {
    id: row.id,
    clientId: row.clientId,
    title: row.title,
    priority: row.priority as TaskPriority,
    status: row.status as TaskStatus,
    owner: row.owner,
    due: row.due,
  };
}

export function mapRisk(row: {
  id: string;
  clientId: number;
  title: string;
  type: string;
  severity: string;
  status: string;
}): Risk {
  return {
    id: row.id,
    clientId: row.clientId,
    title: row.title,
    type: row.type as RiskType,
    severity: row.severity as RiskSeverity,
    status: row.status as RiskStatus,
  };
}

export function mapComm(row: {
  id: string;
  clientId: number;
  subject: string;
  channel: string;
  whenLabel: string;
}): Comm {
  return {
    id: row.id,
    clientId: row.clientId,
    subject: row.subject,
    channel: row.channel as Comm["channel"],
    when: row.whenLabel,
  };
}

export function mapFollowUp(row: {
  id: string;
  clientId: number;
  note: string;
  due: string;
  tone: string;
}): FollowUp {
  return {
    id: row.id,
    clientId: row.clientId,
    note: row.note,
    due: row.due,
    tone: row.tone as FollowUp["tone"],
  };
}

export function phaseCode(phase: number) {
  return PHASE_BY_ID[phase as PhaseId]?.code ?? `P${phase}`;
}
