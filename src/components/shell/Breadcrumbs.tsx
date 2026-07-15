import Link from "next/link";

export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-vco-muted">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 ? <span className="text-slate-300">/</span> : null}
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="font-medium text-slate-600 hover:text-[#1E40FF]"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    last
                      ? "font-semibold text-vco-ink"
                      : "font-medium text-slate-600"
                  }
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
