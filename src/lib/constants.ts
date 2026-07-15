import type { GateDef, PhaseDef, PhaseId } from "./types";

export const PHASES: PhaseDef[] = [
  { id: 1, code: "P1", name: "Contract Signed" },
  { id: 2, code: "P2", name: "Client Onboarding" },
  { id: 3, code: "P3", name: "Business Setup" },
  { id: 4, code: "P4", name: "UI/UX Design" },
  { id: 5, code: "P5", name: "Client Review" },
  { id: 6, code: "P6", name: "Development" },
  { id: 7, code: "P7", name: "Customizations" },
  { id: 8, code: "P8", name: "QA" },
  { id: 9, code: "P9", name: "Launch Prep" },
  { id: 10, code: "P10", name: "Go Live" },
  { id: 11, code: "P11", name: "Hypercare" },
];

/** 24 launch gates — [name, phase, critical, ownerType] from the HTML prototype. */
export const GATE_CATALOG: GateDef[] = [
  { name: "Contract Signed", phase: 1, critical: true, ownerType: "Client" },
  { name: "Invoice Paid", phase: 1, critical: true, ownerType: "Client" },
  { name: "Welcome Email", phase: 2, critical: false, ownerType: "Internal" },
  { name: "Onboarding Questionnaire", phase: 2, critical: false, ownerType: "Internal" },
  { name: "Brand Kit Received", phase: 2, critical: false, ownerType: "Client" },
  { name: "Logo Received", phase: 2, critical: false, ownerType: "Client" },
  { name: "Fonts Received", phase: 2, critical: false, ownerType: "Client" },
  { name: "Colors Received", phase: 2, critical: false, ownerType: "Client" },
  { name: "Domain Received", phase: 2, critical: true, ownerType: "Client" },
  { name: "Hosting Credentials", phase: 2, critical: true, ownerType: "Client" },
  { name: "Business Email", phase: 2, critical: false, ownerType: "Client" },
  { name: "LLC Registered", phase: 3, critical: false, ownerType: "Client" },
  { name: "LegitScript Submitted", phase: 3, critical: false, ownerType: "Client" },
  { name: "LegitScript Approved", phase: 3, critical: true, ownerType: "Client" },
  { name: "Mockups", phase: 4, critical: false, ownerType: "Internal" },
  { name: "Mockups Approved", phase: 5, critical: false, ownerType: "Client" },
  { name: "Development Complete", phase: 6, critical: false, ownerType: "Internal" },
  { name: "Treatment Options Configured", phase: 6, critical: false, ownerType: "Internal" },
  { name: "Payment Gateway Connected", phase: 6, critical: true, ownerType: "Internal" },
  { name: "QA Passed", phase: 8, critical: true, ownerType: "Internal" },
  { name: "Training Complete", phase: 9, critical: false, ownerType: "Internal" },
  { name: "Website Live", phase: 10, critical: true, ownerType: "Internal" },
  { name: "Telehealth Platform Live", phase: 10, critical: true, ownerType: "Internal" },
  { name: "Project Handover", phase: 11, critical: false, ownerType: "Internal" },
];

export const PHASE_BY_ID = Object.fromEntries(
  PHASES.map((p) => [p.id, p]),
) as Record<PhaseId, PhaseDef>;

export const BRAND = {
  blue: "#2E5BFF",
  blueDeep: "#1E40FF",
  ink: "#0F172A",
  muted: "#64748B",
  border: "#E6EBF2",
  surface: "#F1F5F9",
  red: "#EF4444",
  redText: "#B42318",
  redBg: "#FEF3F2",
  yellow: "#F59E0B",
  yellowText: "#B54708",
  yellowBg: "#FFFAEB",
  green: "#16A34A",
  greenBg: "#ECFDF3",
} as const;
