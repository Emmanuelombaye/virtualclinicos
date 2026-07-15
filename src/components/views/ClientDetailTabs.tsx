"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { GateStatusSelect } from "@/components/views/GateStatusSelect";
import { TaskStatusSelect } from "@/components/views/TaskStatusSelect";
import { RiskStatusSelect } from "@/components/views/RiskStatusSelect";
import { CreateCommForm } from "@/components/views/CreateCommForm";
import { CommentThread } from "@/components/views/CommentThread";
import { FileUploadButton } from "@/components/views/FileUploadButton";
import type { Comm, DerivedGate, Risk, Task } from "@/lib/types";
import { cn } from "@/lib/ui";

type Tab =
  | "deliverables"
  | "tasks"
  | "comms"
  | "risks"
  | "activity"
  | "comments"
  | "files";

type ActivityRow = {
  id: string;
  summary: string;
  createdAt: string | Date;
  actor: { name: string; initials: string } | null;
};

type CommentRow = {
  id: string;
  body: string;
  createdAt: string | Date;
  author: { id: string; name: string; initials: string };
  reactions: { emoji: string }[];
  replies?: CommentRow[];
};

type FileRow = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string | Date;
};

export function ClientDetailTabs({
  clientId,
  gates,
  tasks,
  comms,
  risks,
  aeName,
  activity,
  comments,
  files,
  canComment,
  canUpload,
}: {
  clientId: number;
  gates: (DerivedGate & { id?: string })[];
  tasks: Task[];
  comms: Comm[];
  risks: Risk[];
  aeName: string;
  activity: ActivityRow[];
  comments: CommentRow[];
  files: FileRow[];
  canComment: boolean;
  canUpload: boolean;
}) {
  const [tab, setTab] = useState<Tab>("deliverables");

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "deliverables", label: "Deliverables", count: gates.length },
    { id: "tasks", label: "Tasks", count: tasks.length },
    { id: "comms", label: "Comms", count: comms.length },
    { id: "risks", label: "Risks", count: risks.length },
    { id: "activity", label: "Activity", count: activity.length },
    { id: "comments", label: "Comments", count: comments.length },
    { id: "files", label: "Files", count: files.length },
  ];

  return (
    <div className="rounded-xl border border-vco-border bg-white">
      <div className="flex flex-wrap gap-1 border-b border-vco-border px-2 pt-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-t-lg px-3 py-2 text-sm font-medium",
              tab === t.id
                ? "border-b-2 border-[#2E5BFF] text-[#1E40FF]"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        {tab === "deliverables" ? (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-vco-border text-[11px] tracking-wide text-slate-400 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Deliverable</th>
                <th className="px-4 py-3 font-semibold">Phase</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
              </tr>
            </thead>
            <tbody>
              {gates.map((g) => (
                <tr
                  key={g.name}
                  className="border-b border-vco-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-vco-ink">
                    {g.name}
                    {g.critical ? (
                      <span className="ml-1 text-[#F59E0B]">★</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">P{g.phase}</td>
                  <td className="px-4 py-3">
                    {g.id ? (
                      <GateStatusSelect gateId={g.id} status={g.status} />
                    ) : (
                      <Badge label={g.status} />
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {g.ownerType === "Internal" ? aeName : "Client"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {tab === "tasks" ? (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-vco-border text-[11px] tracking-wide text-slate-400 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Task</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Due</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-vco-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-vco-ink">
                    {t.title}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={t.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <TaskStatusSelect taskId={t.id} status={t.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {tab === "comms" ? (
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-vco-border px-4 py-3">
              <div className="text-sm font-semibold text-vco-ink">Comms log</div>
              <CreateCommForm clientId={clientId} />
            </div>
            {comms.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-vco-muted">
                No comms yet
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-vco-border text-[11px] tracking-wide text-slate-400 uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Subject</th>
                    <th className="px-4 py-3 font-semibold">Channel</th>
                    <th className="px-4 py-3 font-semibold">When</th>
                  </tr>
                </thead>
                <tbody>
                  {comms.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-vco-border last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-vco-ink">
                        {c.subject}
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={c.channel} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">{c.when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : null}

        {tab === "risks" ? (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-vco-border text-[11px] tracking-wide text-slate-400 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Risk / Issue</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Severity</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {risks.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-vco-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-vco-ink">
                    {r.title}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={r.type} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={r.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <RiskStatusSelect riskId={r.id} status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {tab === "activity" ? (
          <ul className="divide-y divide-vco-border">
            {activity.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-vco-muted">
                No activity yet
              </li>
            ) : (
              activity.map((a) => (
                <li key={a.id} className="px-4 py-3 text-sm">
                  <div className="font-medium text-vco-ink">{a.summary}</div>
                  <div className="text-[11px] text-vco-muted">
                    {a.actor?.name ?? "System"} ·{" "}
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                </li>
              ))
            )}
          </ul>
        ) : null}

        {tab === "comments" ? (
          <CommentThread
            clientId={clientId}
            entityType="Client"
            entityId={String(clientId)}
            comments={comments}
            canComment={canComment}
          />
        ) : null}

        {tab === "files" ? (
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-vco-ink">Files</div>
              {canUpload ? (
                <FileUploadButton
                  clientId={clientId}
                  entityType="Client"
                  entityId={String(clientId)}
                />
              ) : null}
            </div>
            {files.length === 0 ? (
              <p className="text-sm text-vco-muted">No files uploaded.</p>
            ) : (
              <ul className="space-y-2">
                {files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between rounded-lg border border-vco-border px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="font-medium text-vco-ink">{f.name}</div>
                      <div className="text-[11px] text-vco-muted">
                        {f.mimeType} · {Math.round(f.sizeBytes / 1024)} KB
                      </div>
                    </div>
                    <a
                      href={`/api/v1/files/${f.id}/download`}
                      className="text-xs font-semibold text-[#1E40FF]"
                    >
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
