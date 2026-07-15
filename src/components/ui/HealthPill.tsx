import { healthStyles } from "@/lib/ui";
import type { Health } from "@/lib/types";

export function HealthPill({
  health,
  suffix = "",
}: {
  health: Health;
  suffix?: string;
}) {
  const s = healthStyles(health);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: s.bg, color: s.text }}
    >
      <span
        className="size-[7px] shrink-0 rounded-full"
        style={{ background: s.dot }}
      />
      {s.label}
      {suffix}
    </span>
  );
}

export function HealthDot({ health }: { health: Health }) {
  const s = healthStyles(health);
  return (
    <span
      className="inline-block size-2.5 rounded-full"
      style={{ background: s.dot }}
      title={s.label}
    />
  );
}
