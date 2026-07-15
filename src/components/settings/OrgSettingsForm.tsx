"use client";

import { useState, useTransition } from "react";
import { updateOrgSettingsAction } from "@/lib/actions";

export function OrgSettingsForm({
  initial,
}: {
  initial: {
    name: string;
    primaryColor: string | null;
    domain: string | null;
    timezone: string;
    country: string;
    fiscalYearStartMonth: number;
    notificationSettingsJson: string;
  };
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [emailOn, setEmailOn] = useState(() => {
    try {
      return JSON.parse(initial.notificationSettingsJson).email !== false;
    } catch {
      return true;
    }
  });

  return (
    <form
      className="max-w-xl space-y-4 rounded-xl border border-vco-border bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          setMessage(null);
          await updateOrgSettingsAction({
            name: String(fd.get("name") ?? ""),
            primaryColor: String(fd.get("primaryColor") || "") || null,
            domain: String(fd.get("domain") || "") || null,
            timezone: String(fd.get("timezone") ?? "UTC"),
            country: String(fd.get("country") ?? "US"),
            fiscalYearStartMonth: Number(fd.get("fiscalYearStartMonth") ?? 1),
            notificationSettingsJson: JSON.stringify({
              email: emailOn,
              inApp: true,
            }),
          });
          setMessage("Saved");
        });
      }}
    >
      <Field label="Name" name="name" defaultValue={initial.name} required />
      <Field
        label="Primary color"
        name="primaryColor"
        defaultValue={initial.primaryColor ?? "#2E5BFF"}
      />
      <Field
        label="Domain"
        name="domain"
        defaultValue={initial.domain ?? ""}
        placeholder="clinics.example.com"
      />
      <Field
        label="Timezone"
        name="timezone"
        defaultValue={initial.timezone}
      />
      <Field label="Country" name="country" defaultValue={initial.country} />
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-slate-500">
          Fiscal year start month
        </span>
        <input
          name="fiscalYearStartMonth"
          type="number"
          min={1}
          max={12}
          defaultValue={initial.fiscalYearStartMonth}
          className="h-10 w-full rounded-lg border border-vco-border px-3 text-sm"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={emailOn}
          onChange={(e) => setEmailOn(e.target.checked)}
        />
        Email notifications enabled
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#2E5BFF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
      {message ? (
        <p className="text-sm font-medium text-emerald-700">{message}</p>
      ) : null}
    </form>
  );
}

function Field(props: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-500">
        {props.label}
      </span>
      <input
        name={props.name}
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        required={props.required}
        className="h-10 w-full rounded-lg border border-vco-border px-3 text-sm outline-none focus:border-[#2E5BFF]"
      />
    </label>
  );
}
