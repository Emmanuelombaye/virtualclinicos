"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Step = {
  id: string;
  label: string;
  href: string;
  done: boolean;
};

export function WelcomeChecklist({ steps }: { steps: Step[] }) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const doneCount = steps.filter((s) => s.done).length;

  if (hidden) return null;

  return (
    <section className="mb-5 overflow-hidden rounded-xl border border-[#CDDBFF] bg-[linear-gradient(135deg,#EFF4FF_0%,#FFFFFF_55%)] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-vco-ink">
            Get your workspace launch-ready
          </h2>
          <p className="mt-1 text-sm text-vco-muted">
            {doneCount} of {steps.length} complete — follow these steps for a
            clean delivery ops setup.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void fetch("/api/v1/me", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ dismissWelcome: true }),
            }).then(() => {
              setHidden(true);
              router.refresh();
            });
          }}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700"
        >
          Dismiss
        </button>
      </div>

      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {steps.map((step, i) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className="flex items-center gap-3 rounded-lg border border-white/80 bg-white/90 px-3 py-2.5 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-[#CDDBFF]"
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  step.done
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-[#EFF4FF] text-[#1E40FF]"
                }`}
              >
                {step.done ? "✓" : i + 1}
              </span>
              <span
                className={
                  step.done
                    ? "font-medium text-slate-500 line-through"
                    : "font-semibold text-vco-ink"
                }
              >
                {step.label}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
