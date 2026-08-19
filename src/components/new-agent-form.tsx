"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { j, type ToolRow } from "@/lib/client";
import { IconClose, IconPlus, IconSpinner, IconTerminal } from "./icons";

const BLANK = { name: "", description: "", destructive: false };

export function NewAgentForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState(`You are a helpful assistant.\n\nBe helpful and concise.`);
  const [tools, setTools] = useState<ToolRow[]>([{ ...BLANK, name: "get_order", description: "Look up an order by id", params: { orderId: { type: "string" } } }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const setTool = (i: number, patch: Partial<ToolRow>) =>
    setTools((ts) => ts.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  const addTool = () => setTools((ts) => [...ts, { ...BLANK, params: {} }]);
  const removeTool = (i: number) => setTools((ts) => ts.filter((_, j) => j !== i));

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await j<{ agentId: string; slug: string }>("/api/agents", {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          systemPrompt: prompt,
          tools: tools.filter((t) => t.name.trim()),
        }),
      });
      router.push(`/agents/${res.slug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to create agent");
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[760px] mx-auto px-8 py-10">
      <div className="flex items-center gap-2.5 mb-6">
        <span className="w-8 h-8 rounded-[9px] bg-gradient-to-b from-[#6f79f7] to-[#4a54d8] flex items-center justify-center">
          <IconTerminal size={15} className="text-white" />
        </span>
        <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-white">Register an agent</h1>
      </div>

      <div className="space-y-5">
        <div className="panel p-5">
          <div className="label mb-3">Agent</div>
          <div className="space-y-3.5">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-dim)] mb-1.5">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Support Agent" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-dim)] mb-1.5">Description</label>
              <input
                className="input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this agent do?"
              />
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <div className="label mb-3">System prompt</div>
          <textarea
            className="textarea mono text-[12.5px] leading-[1.65] min-h-[200px]"
            spellCheck={false}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="label">Tools</div>
            <button className="btn btn-ghost btn-sm" onClick={addTool}>
              <IconPlus size={12} />
              Add
            </button>
          </div>
          <div className="space-y-2.5">
            {tools.map((t, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <input
                  className="input mono flex-1"
                  placeholder="tool_name"
                  value={t.name}
                  onChange={(e) => setTool(i, { name: e.target.value })}
                />
                <input
                  className="input flex-[2]"
                  placeholder="description"
                  value={t.description}
                  onChange={(e) => setTool(i, { description: e.target.value })}
                />
                <label className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-dim)] shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={t.destructive}
                    onChange={(e) => setTool(i, { destructive: e.target.checked })}
                    className="accent-[var(--accent)]"
                  />
                  destructive
                </label>
                <button className="text-[var(--text-faint)] hover:text-[var(--bad)] p-1 shrink-0" onClick={() => removeTool(i)}>
                  <IconClose size={13} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[var(--text-faint)] mt-3">
            Destructive tools trigger identity and approval checks in adversarial scenarios.
          </p>
        </div>

        {error ? (
          <div className="panel p-3 text-[12.5px] text-[var(--bad)]" style={{ borderColor: "rgba(240,98,111,0.3)" }}>
            {error}
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <button className="btn btn-primary btn-lg" onClick={submit} disabled={busy || !name.trim()}>
            {busy ? <IconSpinner size={14} /> : <IconPlus size={14} />}
            {busy ? "Registering…" : "Register and continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
