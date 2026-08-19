import type { ToolDef } from "./types";

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export type ChatMsg =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content?: string; tool_calls?: ToolCallMsg[] }
  | { role: "tool"; tool_call_id: string; content: string };

type ToolCallMsg = { id: string; type: "function"; function: { name: string; arguments: string } };

export type ToolCall = { id: string; name: string; args: Record<string, unknown> };

export type ChatResult = {
  content: string;
  toolCalls: ToolCall[];
};

function schemasToOpenAI(tools: ToolDef[]) {
  return tools.map((t) => {
    const properties: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(t.params ?? {})) {
      properties[k] = { type: v.type, description: v.description };
    }
    return {
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: { type: "object", properties, required: Object.keys(properties) },
      },
    };
  });
}

export async function geminiChat(
  messages: ChatMsg[],
  opts?: { tools?: ToolDef[]; temperature?: number; maxTokens?: number; timeoutMs?: number }
): Promise<ChatResult> {
  const base = process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta/openai";
  const timeout = opts?.timeoutMs ?? 30_000;
  const tools = opts?.tools && opts.tools.length > 0 ? schemasToOpenAI(opts.tools) : undefined;

  const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
    },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      messages,
      temperature: opts?.temperature ?? 0.4,
      max_tokens: opts?.maxTokens ?? 900,
      ...(tools ? { tools, tool_choice: "auto" } : {}),
    }),
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`gemini ${res.status}: ${body.slice(0, 220)}`);
  }

  const data = await res.json();
  const msg = data.choices?.[0]?.message;
  const toolCalls: ToolCall[] = (msg?.tool_calls ?? []).map((tc: ToolCallMsg) => {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(tc.function.arguments ?? "{}");
    } catch {
      args = {};
    }
    return { id: tc.id, name: tc.function.name, args };
  });

  return { content: typeof msg?.content === "string" ? msg.content : "", toolCalls };
}

export async function geminiText(
  system: string,
  user: string,
  opts?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const r = await geminiChat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: opts?.temperature ?? 0.6, maxTokens: opts?.maxTokens ?? 900 }
  );
  return r.content;
}
