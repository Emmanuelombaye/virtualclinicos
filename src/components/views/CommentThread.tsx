"use client";

import { useState, useTransition } from "react";
import {
  createCommentAction,
  deleteCommentAction,
  toggleReactionAction,
} from "@/lib/actions";

type CommentRow = {
  id: string;
  body: string;
  createdAt: string | Date;
  author: { id: string; name: string; initials: string };
  reactions: { emoji: string; userId?: string }[];
  replies?: CommentRow[];
};

export function CommentThread({
  clientId,
  entityType,
  entityId,
  comments,
  canComment,
}: {
  clientId: number;
  entityType: "Client" | "Task" | "Risk" | "ClientGate";
  entityId: string;
  comments: CommentRow[];
  canComment: boolean;
}) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4 p-4">
      {canComment ? (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!body.trim()) return;
            start(async () => {
              await createCommentAction({
                entityType,
                entityId,
                clientId,
                body: body.trim(),
              });
              setBody("");
            });
          }}
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Add a comment… use @Name to mention"
            className="w-full rounded-lg border border-vco-border px-3 py-2 text-sm outline-none focus:border-[#2E5BFF]"
          />
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="rounded-lg bg-[#2E5BFF] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Posting…" : "Comment"}
          </button>
        </form>
      ) : null}

      {comments.length === 0 ? (
        <p className="text-sm text-vco-muted">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-vco-border p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-vco-ink">
                  {c.author.name}
                </div>
                <div className="text-[11px] text-vco-muted">
                  {new Date(c.createdAt).toLocaleString()}
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {c.body}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {["👍", "👀", "⚠️"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="rounded border border-vco-border px-1.5 text-xs hover:bg-slate-50"
                    onClick={() =>
                      start(async () => {
                        await toggleReactionAction({
                          commentId: c.id,
                          emoji,
                          clientId,
                        });
                      })
                    }
                  >
                    {emoji}{" "}
                    {c.reactions.filter((r) => r.emoji === emoji).length || ""}
                  </button>
                ))}
                <button
                  type="button"
                  className="text-xs font-semibold text-slate-500 hover:text-[#B42318]"
                  onClick={() =>
                    start(async () => {
                      await deleteCommentAction(c.id, clientId);
                    })
                  }
                >
                  Delete
                </button>
              </div>
              {c.replies?.length ? (
                <ul className="mt-3 space-y-2 border-l border-vco-border pl-3">
                  {c.replies.map((r) => (
                    <li key={r.id} className="text-sm">
                      <span className="font-semibold">{r.author.name}</span>:{" "}
                      {r.body}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
