"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { j } from "@/lib/client";
import { IconBolt, IconBot, IconSpinner, IconTerminal } from "./icons";
import { PolicyChips } from "./policy-chips";
import { RunOverlay } from "./run-overlay";

export function AgentWorkspace({
  slug,
  initialPrompt,
  nextVersionLabel,
  geminiAvailable,
}: {
  slug: string;
  initialPrompt: string;
  nextVersionLabel: string;
  geminiAvailable: boolean;
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [mode, setMode] = useState<"simulator" | "llm">("simulator");
  const [busy, setBusy] = useState(false);
  const dirty = prompt !== initialPrompt;

  const run = async () => {
    setBusy(true);
    try {
      const res = await j<{ evaluationId: string }>(`/api/agents/${slug}`, {
        method: "POST",
        body: JSON.stringify({ prompt, mode }),
      });
      router.push(`/evaluations/${res.evaluationId}`);
    } catch {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <IconTerminal size={13} className="text-[var(--text-faint)]" />
          <span className="text-[12px] font-semibold text-white tracking-[-0.01em]">System prompt</span>
          {dirty ? (
            <span className="tag tag-warn">
              <span className="dot" style={{ background: "var(--warn)" }} />
              unsaved edits · creates {nextVersionLabel}
            </span>
          ) : (
            <span className="tag tag-faint">{nextVersionLabel}</span>
          )}
        </div>
        <button className="btn btn-ghost btn-sm" disabled={!dirty} onClick={() => setPrompt(initialPrompt)}>
          Reset
        </button>
      </div>

      <div className="panel overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-2 hairline-b bg-[var(--bg-elev)]">
          <span className="w-2 h-2 rounded-full bg-[#3A3D45]" />
          <span className="w-2 h-2 rounded-full bg-[#3A3D45]" />
          <span className="w-2 h-2 rounded-full bg-[#3A3D45]" />
          <span className="mono text-[10.5px] text-[var(--text-faint)] ml-2">agentguard --prompt {nextVersionLabel}</span>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          spellCheck={false}
          className="w-full mono text-[12.5px] leading-[1.65] p-4 bg-transparent resize-y focus:outline-none text-[#D8DAE0] code-scroll min-h-[340px]"
          style={{ fontFeatureSettings: "none" }}
        />
        <div className="px-4 py-2.5 hairline-t flex items-center justify-between bg-[var(--bg-elev)]">
          <span className="mono text-[10.5px] text-[var(--text-faint)]">{prompt.length.toLocaleString()} chars</span>
          <span className="mono text-[10.5px] text-[var(--text-faint)]">{prompt.split("\n").length} lines</span>
        </div>
      </div>

      <div className="mt-3">
        <div className="label mb-2">Detected policy</div>
        <PolicyChips prompt={prompt} />
        <p className="text-[11px] text-[var(--text-faint)] mt-2 leading-relaxed">
          AgentGuard parses your prompt for behavior rules. Rules control what the sandbox expects from your agent.
          Edit the prompt above and watch the detection update live.
        </p>
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button className="btn btn-primary btn-lg" onClick={run} disabled={busy}>
          {busy ? <IconSpinner size={14} /> : <IconBolt size={14} />}
          {busy ? "Running…" : "Run adversarial scan"}
        </button>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-elev)] border border-[var(--line)]" role="tablist">
          <button
            role="tab"
            aria-selected={mode === "simulator"}
            onClick={() => setMode("simulator")}
            className={`h-7 px-3 rounded-md text-[12px] font-medium flex items-center gap-1.5 transition-colors duration-150 ${
              mode === "simulator" ? "bg-white/[0.07] text-white" : "text-[var(--text-dim)] hover:text-white"
            }`}
          >
            <IconTerminal size={12} />
            Simulator
          </button>
          <button
            role="tab"
            aria-selected={mode === "llm"}
            onClick={() => geminiAvailable && setMode("llm")}
            disabled={!geminiAvailable}
            title={
              geminiAvailable
                ? "Run your agent live against Gemini in the sandbox"
                : "Add GEMINI_API_KEY to enable live model runs"
            }
            className={`h-7 px-3 rounded-md text-[12px] font-medium flex items-center gap-1.5 transition-colors duration-150 ${
              mode === "llm" ? "bg-white/[0.07] text-white" : "text-[var(--text-dim)] hover:text-white"
            } ${!geminiAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <IconBot size={12} />
            Gemini
          </button>
        </div>

        {dirty ? (
          <span className="text-[12px] text-[var(--warn)]">Running will register a new version and compare against the last one.</span>
        ) : null}
      </div>

      {busy ? <RunOverlay mode={mode} /> : null}
    </div>
  );
}
