export function KpiCard({
  label,
  value,
  hint,
  hintTone = "muted",
}: {
  label: string;
  value: string | number;
  hint?: string;
  hintTone?: "muted" | "danger";
}) {
  return (
    <div className="rounded-xl border border-vco-border bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="text-[11px] font-semibold tracking-wide text-vco-muted uppercase">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-vco-ink">
        {value}
      </div>
      {hint ? (
        <div
          className={`mt-1 text-xs font-medium ${
            hintTone === "danger" ? "text-[#B42318]" : "text-vco-muted"
          }`}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}
