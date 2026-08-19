"use client";

import { useEffect, useState } from "react";
import type { RunResultDto } from "@/lib/client";
import { IconTerminal, IconX } from "./icons";

function shortData(data: unknown): string {
  if (data == null) return "∅";
  if (typeof data === "string") return data.length > 90 ? `${data.slice(0, 90)}…` : data;
  try {
    const s = JSON.stringify(data);
    return s.length > 120 ? `${s.slice(0, 120)}…` : s;
  } catch {
    return String(data);
  }
}

function fmtArgs(args: Record<string, unknown> | undefined): string {
  if (!args || Object.keys(args).length === 0) return "";
  return Object.entries(args)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}

const STEP_MS = 620;

export function TranscriptViewer({ steps }: { steps: RunResultDto["steps"] }) {
  const [visible, setVisible] = useState(steps.length);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (visible >= steps.length) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setVisible((v) => v + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [playing, visible, steps.length]);

  if (steps.length === 0) return <div className="text-[12px] text-[var(--text-faint)]">no transcript</div>;

  const replaying = visible < steps.length;
  const replay = () => {
    setVisible(0);
    setPlaying(true);
  };
  const stop = () => {
    setPlaying(false);
    setVisible(steps.length);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className="mono text-[10.5px] text-[var(--text-faint)]">
          {visible}/{steps.length} steps
          {replaying ? " · replaying" : ""}
        </span>
        <div className="flex items-center gap-1.5">
          {playing || replaying ? (
            <button className="btn btn-ghost btn-sm" onClick={stop}>
              <IconX size={11} />
              Stop
            </button>
          ) : (
            <button className="btn btn-sm" onClick={replay}>
              <IconTerminal size={11} />
              Replay
            </button>
          )}
        </div>
      </div>

      <div className="h-[2px] rounded-full bg-[#191B1F] overflow-hidden mb-3">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
          style={{ width: `${(visible / steps.length) * 100}%` }}
        />
      </div>

      <div className="space-y-2">
        {steps.slice(0, visible).map((s, i) => (
          <div key={i} className={i === visible - 1 && replaying ? "animate-fade-in" : ""}>
            <StepRow s={s} />
          </div>
        ))}
        {replaying ? <div className="mono text-[11px] text-[var(--text-faint)] animate-pulse-soft">…</div> : null}
      </div>
    </div>
  );
}

function StepRow({ s }: { s: RunResultDto["steps"][number] }) {
  if (s.kind === "user") {
    return (
      <div className="flex gap-2.5">
        <span className="w-[52px] shrink-0 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-faint)] pt-0.5">
          User
        </span>
        <div className="text-[12.5px] leading-relaxed text-[var(--text)]">{s.text}</div>
      </div>
    );
  }
  if (s.kind === "assistant") {
    return (
      <div className="flex gap-2.5">
        <span className="w-[52px] shrink-0 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-soft)] pt-0.5">
          Agent
        </span>
        <div className="text-[12.5px] leading-relaxed text-[var(--text)]">{s.text}</div>
      </div>
    );
  }
  if (s.kind === "tool_call") {
    return (
      <div className="flex gap-2.5">
        <span className="w-[52px] shrink-0 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-faint)] pt-0.5">
          Call
        </span>
        <div className="mono text-[12px] leading-relaxed text-[#C7CBFF] bg-[rgba(139,147,255,0.06)] border border-[rgba(139,147,255,0.16)] rounded-md px-2.5 py-1.5 flex-1 break-all">
          {s.tool}
          {fmtArgs(s.args) ? `(${fmtArgs(s.args)})` : "()"}
        </div>
      </div>
    );
  }
  if (s.kind === "tool_result") {
    const ok = s.ok;
    return (
      <div className="flex gap-2.5">
        <span className="w-[52px] shrink-0 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-faint)] pt-0.5">
          Result
        </span>
        <div
          className={`mono text-[12px] leading-relaxed rounded-md px-2.5 py-1.5 flex-1 break-all ${
            ok
              ? "text-[#8FD9B5] bg-[rgba(76,208,140,0.05)] border border-[rgba(76,208,140,0.14)]"
              : "text-[#FF98A0] bg-[rgba(240,98,111,0.05)] border border-[rgba(240,98,111,0.16)]"
          }`}
        >
          {ok ? "ok" : "error"} · {shortData(s.data)}
        </div>
      </div>
    );
  }
  if (s.kind === "sys") {
    return (
      <div className="flex gap-2.5">
        <span className="w-[52px] shrink-0" />
        <div className="mono text-[11.5px] text-[var(--warn)]">{s.text}</div>
      </div>
    );
  }
  return null;
}
