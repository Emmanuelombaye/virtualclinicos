export type DelayRiskInput = {
  overdueTasks: number;
  openCriticalRisks: number;
  aeCapacityLoad: number;
  waitDays: number;
  daysToLaunch: number;
  criticalOverdue: number;
};

export type DelayRiskResult = {
  score: number;
  reasons: string[];
};

/** Heuristic 0–100 delay risk score for a launch. */
export function computeDelayRisk(input: DelayRiskInput): DelayRiskResult {
  const reasons: string[] = [];
  let score = 0;

  if (input.overdueTasks > 0) {
    const add = Math.min(30, input.overdueTasks * 8);
    score += add;
    reasons.push(`${input.overdueTasks} overdue task(s)`);
  }
  if (input.openCriticalRisks > 0) {
    const add = Math.min(25, input.openCriticalRisks * 12);
    score += add;
    reasons.push(`${input.openCriticalRisks} open critical risk(s)`);
  }
  if (input.aeCapacityLoad >= 85) {
    score += 15;
    reasons.push(`AE capacity overloaded (${input.aeCapacityLoad}%)`);
  } else if (input.aeCapacityLoad >= 70) {
    score += 8;
    reasons.push(`AE capacity high (${input.aeCapacityLoad}%)`);
  }
  if (input.waitDays >= 7) {
    score += Math.min(20, input.waitDays);
    reasons.push(`Waiting ${input.waitDays} day(s)`);
  }
  if (input.daysToLaunch <= 14 && score > 10) {
    score += 10;
    reasons.push(`Launch in ${input.daysToLaunch} day(s)`);
  }
  if (input.criticalOverdue > 0) {
    score += Math.min(15, input.criticalOverdue * 5);
    reasons.push(`${input.criticalOverdue} critical overdue item(s)`);
  }

  return { score: Math.min(100, Math.round(score)), reasons };
}
