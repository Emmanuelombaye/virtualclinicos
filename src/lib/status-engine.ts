import { GATE_CATALOG, PHASE_BY_ID } from "./constants";
import type {
  Client,
  DerivedClient,
  DerivedGate,
  GateStatus,
  Health,
  Task,
} from "./types";
import { ACCOUNT_EXECUTIVES } from "./seed";

/**
 * Cumulative completed gates BEFORE entering a phase (of 24).
 * From HTML prototype: const CUM = {1:0,2:2,...}
 */
const CUM: Record<number, number> = {
  1: 0,
  2: 2,
  3: 11,
  4: 14,
  5: 15,
  6: 16,
  7: 19,
  8: 19,
  9: 20,
  10: 21,
  11: 23,
};

/** Status is computed — never typed freehand. */
export function gateStatusFor(client: Client, gatePhase: number): GateStatus {
  if (client.status === "Hypercare" || client.daysToLaunch < 0) {
    return "Complete";
  }
  if (gatePhase < client.phase) return "Complete";
  if (gatePhase === client.phase) return "In Progress";
  return "Not Started";
}

export function gatesFor(client: Client): DerivedGate[] {
  return GATE_CATALOG.map((g) => ({
    ...g,
    status: gateStatusFor(client, g.phase),
  }));
}

export function completionFor(client: Client): number {
  if (client.status === "Hypercare" || client.daysToLaunch < 0) return 100;
  const done = CUM[client.phase] ?? 0;
  return Math.round((done / GATE_CATALOG.length) * 100);
}

/**
 * Recompute health from signals (matches seed classifications in the prototype).
 */
export function computeHealth(client: Client): Health {
  if (client.status === "Hypercare" || client.daysToLaunch < 0) return "green";
  if (client.criticalOverdue > 0) return "red";
  if (client.daysToLaunch > 0 && client.daysToLaunch <= 5 && client.phase < 10) {
    return "red";
  }
  if (client.waitingOn === "Client" && client.waitDays >= 10) return "red";
  if (client.waitingOn !== "Nothing" && client.waitDays >= 5) return "yellow";
  if (client.daysToLaunch > 50 && client.phase <= 2) return "red";
  if (client.phase <= 5 && client.waitingOn !== "Nothing") return "yellow";
  return "green";
}

export function launchLabel(client: Client): string {
  if (client.daysToLaunch < 0) {
    return `Launched ${Math.abs(client.daysToLaunch)}d ago`;
  }
  if (client.daysToLaunch <= 5) return `${client.daysToLaunch}d`;
  return `in ${client.daysToLaunch}d`;
}

export function phaseLabel(client: Client): string {
  const p = PHASE_BY_ID[client.phase];
  return `${p.code} - ${p.name}`;
}

export function deriveClient(client: Client, tasks: Task[]): DerivedClient {
  const gates = gatesFor(client);
  const openTaskCount = tasks.filter(
    (t) => t.clientId === client.id && t.status !== "Done",
  ).length;

  return {
    ...client,
    ae: ACCOUNT_EXECUTIVES[client.aeId],
    // Prefer seed health for pixel-fidelity; computeHealth() is the evolution path.
    health: client.health ?? computeHealth(client),
    completion: completionFor(client),
    phaseLabel: phaseLabel(client),
    launchLabel: launchLabel(client),
    openTaskCount,
    gates,
    deliverablesLeft: gates.filter((g) => g.status !== "Complete").length,
    criticalLeft: gates.filter((g) => g.critical && g.status !== "Complete")
      .length,
  };
}
