"use client";

import { useEffect, useState } from "react";
import { IconCheck, IconDatabase, IconPulse, IconSearch, IconSpark, IconSpinner, IconTerminal } from "./icons";

const STAGES = [
  { icon: <IconSpark size={14} />, label: "Generating scenarios" },
  { icon: <IconDatabase size={14} />, label: "Spinning up sandbox" },
  { icon: <IconSearch size={14} />, label: "Executing + capturing traces" },
  { icon: <IconPulse size={14} />, label: "Classifying failures" },
];

export function RunOverlay({ mode }: { mode: "simulator" | "llm" }) {
  const [stage, setStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const a = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 620);
    const b = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-[rgba(8,9,11,0.72)] backdrop-blur-[6px]" />
      <div className="relative w-[380px] panel p-6 animate-scale-in">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[9px] bg-gradient-to-b from-[#6f79f7] to-[#4a54d8] flex items-center justify-center">
            <IconTerminal size={15} className="text-white" />
          </span>
          <div>
            <div className="text-[14px] font-semibold text-white tracking-[-0.01em]">Running adversarial scan</div>
            <div className="text-[11px] text-[var(--text-faint)] mono mt-0.5">
              {mode === "llm" ? "agent: gemini (live)" : "agent: simulator (sandboxed)"} · {elapsed}s
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-1.5">
          {STAGES.map((s, i) => {
            const done = i < stage;
            const active = i === stage;
            return (
              <div
                key={s.label}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors duration-300 ${
                  active ? "bg-white/[0.045]" : ""
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${
                    done
                      ? "bg-[rgba(76,208,140,0.12)] border-[rgba(76,208,140,0.35)] text-[var(--ok)]"
                      : active
                        ? "bg-[rgba(139,147,255,0.12)] border-[rgba(139,147,255,0.4)] text-[var(--accent-soft)]"
                        : "bg-[var(--bg-elev)] border-[var(--line-strong)] text-[var(--text-faint)]"
                  }`}
                >
                  {done ? <IconCheck size={10} /> : active ? <IconSpinner size={11} /> : null}
                </span>
                <span
                  className={`text-[12.5px] flex items-center gap-2 ${
                    done ? "text-[var(--text-dim)]" : active ? "text-white" : "text-[var(--text-faint)]"
                  }`}
                >
                  {s.icon}
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 h-[3px] rounded-full bg-[#191B1F] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#5a64e6] to-[#8b93ff] transition-[width] duration-500 ease-out"
            style={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
