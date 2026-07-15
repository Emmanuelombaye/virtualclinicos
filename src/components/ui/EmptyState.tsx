export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-vco-border bg-white px-6 py-14 text-center">
      <div className="mb-2 text-sm font-semibold text-vco-ink">{title}</div>
      {body ? <p className="max-w-sm text-sm text-vco-muted">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
