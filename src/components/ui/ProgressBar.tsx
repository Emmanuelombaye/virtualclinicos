export function ProgressBar({
  value,
  tone = "blue",
}: {
  value: number;
  tone?: "blue" | "red";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full transition-[width]"
        style={{
          width: `${clamped}%`,
          background: tone === "red" ? "#EF4444" : "#2E5BFF",
        }}
      />
    </div>
  );
}
