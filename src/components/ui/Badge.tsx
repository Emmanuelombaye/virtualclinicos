import { cn } from "@/lib/ui";

const TONES: Record<string, { bg: string; text: string }> = {
  Complete: { bg: "#ECFDF3", text: "#067647" },
  "In Review": { bg: "#EFF4FF", text: "#1E40FF" },
  "In Progress": { bg: "#FFFAEB", text: "#B54708" },
  Blocked: { bg: "#FEF3F2", text: "#B42318" },
  "Not Started": { bg: "#F1F5F9", text: "#64748B" },
  "To Do": { bg: "#F1F5F9", text: "#475569" },
  Done: { bg: "#ECFDF3", text: "#067647" },
  Urgent: { bg: "#FEF3F2", text: "#B42318" },
  High: { bg: "#FFFAEB", text: "#B54708" },
  Medium: { bg: "#EFF4FF", text: "#1E40FF" },
  Low: { bg: "#F1F5F9", text: "#64748B" },
  Critical: { bg: "#FEF3F2", text: "#B42318" },
  Active: { bg: "#EFF4FF", text: "#1E40FF" },
  Client: { bg: "#FFFAEB", text: "#B54708" },
  Internal: { bg: "#EFF4FF", text: "#1E40FF" },
  Open: { bg: "#FEF3F2", text: "#B42318" },
  Mitigating: { bg: "#FFFAEB", text: "#B54708" },
  Issue: { bg: "#F1F5F9", text: "#475569" },
  Risk: { bg: "#F1F5F9", text: "#475569" },
};

export function Badge({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const tone = TONES[label] ?? { bg: "#F1F5F9", text: "#64748B" };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        className,
      )}
      style={{ background: tone.bg, color: tone.text }}
    >
      {label}
    </span>
  );
}
