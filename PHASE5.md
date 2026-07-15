# Phase 5 — Wow Features MVP

## Shipped
- `AiProvider` / `ConsoleAiProvider` (+ OpenAI if `OPENAI_API_KEY`)
- `POST /api/v1/ai/summarize-launch` + client Ask AI panel
- Heuristic delay risk score on client detail, clients API, command center aggregates
- Presence heartbeat in-memory map + poll strip on client page
- Plugin marketplace stub (Slack/HubSpot/Zapier)

## Extension points
- Webhook events + flag `plugin_<slug>` on install
- AI always audited; org-scoped prompts only
