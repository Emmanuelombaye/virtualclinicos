/** Domain types for VirtualClinicOS — mirrored from the HTML prototype. */

export type Health = "red" | "yellow" | "green";
export type ClientStatus = "Active" | "Hypercare";
export type WaitingOn = "Nothing" | "Client" | "Internal";
export type AeId = "maya" | "devon" | "priya";
export type OwnerType = "Client" | "Internal";
export type TaskPriority = "Urgent" | "High" | "Medium" | "Low";
export type TaskStatus = "To Do" | "In Progress" | "Blocked" | "In Review" | "Done";
export type GateStatus = "Complete" | "In Progress" | "Not Started";
export type RiskSeverity = "Critical" | "High" | "Medium" | "Low";
export type RiskType = "Issue" | "Risk";
export type RiskStatus = "Open" | "Mitigating" | "Closed";

export type PhaseId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export interface PhaseDef {
  id: PhaseId;
  code: string;
  name: string;
}

export interface GateDef {
  name: string;
  phase: PhaseId;
  critical: boolean;
  ownerType: OwnerType;
}

export interface AccountExecutive {
  id: AeId;
  name: string;
  initials: string;
  capacityLoad: number;
}

export interface Client {
  id: number;
  name: string;
  aeId: AeId;
  phase: PhaseId;
  status: ClientStatus;
  /** Portfolio health from prototype seed (status engine recomputes in later iterations). */
  health: Health;
  /** Days to launch; negative = days since launch */
  daysToLaunch: number;
  mrr: number;
  waitingOn: WaitingOn;
  waitDays: number;
  criticalOverdue: number;
}

export interface Task {
  id: string;
  title: string;
  clientId: number;
  priority: TaskPriority;
  status: TaskStatus;
  owner: string;
  due: string;
}

export interface Risk {
  id: string;
  clientId: number;
  title: string;
  type: RiskType;
  severity: RiskSeverity;
  status: RiskStatus;
}

export interface FollowUp {
  id: string;
  clientId: number;
  note: string;
  due: string;
  tone: "urgent" | "warn" | "ok";
}

export interface Comm {
  id: string;
  clientId: number;
  subject: string;
  when: string;
  channel: "Email" | "Call" | "Slack";
}

export interface DerivedGate extends GateDef {
  id?: string;
  status: GateStatus;
}

export interface DerivedClient extends Client {
  ae: AccountExecutive;
  health: Health;
  completion: number;
  phaseLabel: string;
  launchLabel: string;
  openTaskCount: number;
  gates: DerivedGate[];
  deliverablesLeft: number;
  criticalLeft: number;
}
