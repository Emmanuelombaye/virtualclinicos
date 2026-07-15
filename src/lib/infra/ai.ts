export type AiMessage = { role: "system" | "user" | "assistant"; content: string };

export interface AiProvider {
  complete(messages: AiMessage[]): Promise<string>;
}

export class ConsoleAiProvider implements AiProvider {
  async complete(messages: AiMessage[]): Promise<string> {
    const last = messages.filter((m) => m.role === "user").pop()?.content ?? "";
    console.log("[ai:console]", last.slice(0, 200));
    return [
      "## Launch summary (demo AI)",
      "",
      "Based on overdue tasks, open risks, and waiting time, prioritize unblocking the critical gate,",
      "assign owners to overdue work, and schedule an AE check-in before launch.",
      "",
      "### Suggested next steps",
      "1. Close or escalate any critical open risks",
      "2. Clear overdue tasks older than 3 days",
      "3. Confirm AE capacity and waiting dependencies",
    ].join("\n");
  }
}

export class OpenAiProvider implements AiProvider {
  constructor(private apiKey: string) {}

  async complete(messages: AiMessage[]): Promise<string> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages,
        temperature: 0.3,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI error: ${res.status} ${text}`);
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return json.choices?.[0]?.message?.content ?? "No response";
  }
}

export function getAiProvider(): AiProvider {
  const key = process.env.OPENAI_API_KEY;
  if (key) return new OpenAiProvider(key);
  return new ConsoleAiProvider();
}
