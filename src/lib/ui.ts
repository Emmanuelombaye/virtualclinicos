import type { Health } from "@/lib/types";

const MAP: Record<Health, { dot: string; bg: string; text: string; label: string }> = {
  red: { dot: "#EF4444", bg: "#FEF3F2", text: "#B42318", label: "Red" },
  yellow: { dot: "#F59E0B", bg: "#FFFAEB", text: "#B54708", label: "Yellow" },
  green: { dot: "#16A34A", bg: "#ECFDF3", text: "#067647", label: "Green" },
};

export function healthStyles(health: Health) {
  return MAP[health];
}

export function clientInitial(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
