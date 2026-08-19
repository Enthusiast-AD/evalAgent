import { geminiChat, isGeminiConfigured, type ChatMsg, type ToolCall } from "./gemini";
import { Sandbox } from "./sandbox";
import type { Scenario, Step, ToolDef, Transcript } from "./types";

const MAX_STEPS = 6;
const LOOP_REPEAT = 3;

export function isLlmModeAvailable(): boolean {
  return isGeminiConfigured();
}

function systemPromptFor(prompt: string, tools: ToolDef[]): string {
  const toolLines = tools.map((t) => `- ${t.name}: ${t.description}`).join("\n");
  return `${prompt}\n\nAvailable tools:\n${toolLines}\n\nAnswer the user. If a task requires a tool, call it with the exact arguments from the conversation. When you are done, reply to the user with a plain text message and stop calling tools.`;
}

export async function runLlmAgent(prompt: string, tools: ToolDef[], scenario: Scenario): Promise<Transcript> {
  const sandbox = new Sandbox(scenario.context, tools);
  const steps: Step[] = [{ kind: "user", text: scenario.userTurn }];
  const messages: ChatMsg[] = [
    { role: "system", content: systemPromptFor(prompt, tools) },
    { role: "user", content: scenario.userTurn },
  ];

  let looped = false;
  let loopDetail: string | undefined;
  let lastKey: string | null = null;
  let repeatCount = 0;
  let endedWithMessage = false;

  for (let i = 0; i < MAX_STEPS; i++) {
    let calls: ToolCall[];
    let content = "";
    try {
      const res = await geminiChat(messages, { tools, temperature: 0.3 });
      content = res.content;
      calls = res.toolCalls;
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      steps.push({ kind: "sys", text: `llm error: ${reason}` });
      steps.push({ kind: "assistant", text: "I hit an internal error and couldn't complete this." });
      return { steps, looped: true, loopDetail: "llm request failed" };
    }

    if (content.trim()) {
      steps.push({ kind: "assistant", text: content });
      endedWithMessage = true;
    }

    if (calls.length === 0) {
      if (!content.trim()) {
        steps.push({ kind: "assistant", text: "I don't have enough information to act on this." });
        endedWithMessage = true;
      }
      break;
    }

    const toolMsgs: ChatMsg[] = [];
    for (const tc of calls) {
      steps.push({ kind: "tool_call", tool: tc.name, args: tc.args, seq: steps.length });
      const result = sandbox.execute(tc.name, tc.args);
      steps.push({
        kind: "tool_result",
        tool: tc.name,
        args: tc.args,
        ok: result.ok,
        data: result.ok ? result.data : { error: result.error },
        seq: steps.length,
      });
      toolMsgs.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result.ok ? result.data : { error: result.error }) });

      const key = `${tc.name}:${JSON.stringify(tc.args)}`;
      if (lastKey === key) {
        repeatCount++;
      } else {
        lastKey = key;
        repeatCount = 1;
      }
    }

    messages.push({
      role: "assistant",
      content: content || "",
      tool_calls: calls.map((c) => ({
        id: c.id,
        type: "function",
        function: { name: c.name, arguments: JSON.stringify(c.args) },
      })),
    });
    messages.push(...toolMsgs);

    if (repeatCount >= LOOP_REPEAT) {
      looped = true;
      loopDetail = `${lastKey} repeated ${LOOP_REPEAT} times`;
      steps.push({ kind: "sys", text: `loop guard: ${loopDetail}` });
      break;
    }
  }

  if (!looped && !endedWithMessage) {
    steps.push({ kind: "sys", text: `step cap: agent exceeded ${MAX_STEPS} steps without a final answer` });
    steps.push({ kind: "assistant", text: "I wasn't able to resolve this within the limit." });
    looped = true;
    loopDetail = `agent exceeded ${MAX_STEPS} steps`;
  }

  return { steps, looped, loopDetail };
}
