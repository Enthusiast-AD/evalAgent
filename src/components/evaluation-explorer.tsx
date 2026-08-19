"use client";

import { useEffect, useMemo, useState } from "react";
import { j, type EvaluationDto, fmtDelta, fmtMs, fmtScore } from "@/lib/client";
import { ScoreRing, CategoryBars, Stat, bandColor } from "./ui";
import { TranscriptViewer } from "./transcript-viewer";
import { CATEGORY_LABEL, type Category, type FailureKind } from "@/engine/types";
import { fixFor } from "@/engine/actionable";
import {
  IconAlert,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconSpinner,
  IconTerminal,
  IconWand,
} from "./icons";

const STAGES = ["GENERATING", "EXECUTING", "ANALYZING", "COMPLETE"];

function severityTone(sev: string) {
  if (sev === "critical") return "bad";
  if (sev === "high") return "bad";
  if (sev === "medium") return "warn";
  return "faint";
}

export function EvaluationExplorer({ initial }: { initial: EvaluationDto }) {
  const [ev, setEv] = useState(initial);
  const [filter, setFilter] = useState<"ALL" | "FAIL" | "PASS">("ALL");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [reveal, setReveal] = useState(0);

  useEffect(() => {
    if (initial.status !== "RUNNING") return;
    const t = setInterval(async () => {
      try {
        const res = await j<{ evaluation: EvaluationDto }>(`/api/evaluations/${initial.id}`);
        setEv(res.evaluation);
        if (res.evaluation.status === "COMPLETE") clearInterval(t);
      } catch {
        clearInterval(t);
      }
    }, 750);
    return () => clearInterval(t);
  }, [initial.id, initial.status]);

  useEffect(() => {
    if (ev.status !== "COMPLETE") return;
    setReveal(0);
    const t = setInterval(() => {
      setReveal((r) => {
        if (r >= STAGES.length) {
          clearInterval(t);
          return r;
        }
        return r + 1;
      });
    }, 360);
    return () => clearInterval(t);
  }, [ev.status, ev.id]);

  const score = ev.score ?? 0;
  const color = bandColor(score);
  const delta = ev.scoreDelta;
  const running = ev.status === "RUNNING";
  const revealed = reveal >= STAGES.length;

  const rows = useMemo(() => {
    const rs = ev.runResults;
    if (filter === "ALL") return rs;
    return rs.filter((r) => r.verdict === filter);
  }, [ev.runResults, filter]);

  const stageIdx = running ? Math.max(0, STAGES.indexOf(ev.stage)) : revealed ? STAGES.length : reveal;

  return (
    <div className="max-w-[1180px] mx-auto px-8 py-8">
      <div className="flex items-start justify-between gap-8 mb-7">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-[var(--text-faint)] mb-2.5">
            <span className="mono text-[var(--text-dim)]">{ev.agent.name}</span>
            {ev.agentVersion?.label ? <span className="tag tag-accent">{ev.agentVersion.label}</span> : null}
            <span className="tag">{ev.mode}</span>
            <span className="mono text-[10.5px]">{ev.id.slice(-8)}</span>
          </div>
          <h1 className="text-[24px] font-semibold tracking-[-0.025em] text-white leading-none">Adversarial scan</h1>
          <div className="flex items-center gap-3 mt-3">
            <span className="tag">
              {ev.passedCount} passed
            </span>
            <span className="tag tag-bad">{ev.failedCount} failed</span>
            <span className="tag">{ev.scenarioCount} scenarios</span>
            <span className="tag">{fmtMs(ev.durationMs)}</span>
            <a href={`/evaluations/${ev.id}/report`} className="btn btn-sm ml-1">
              Reliability report
              <IconChevronRight size={11} />
            </a>
          </div>
        </div>
        <div className="text-right">
          <div className="mono text-[44px] font-semibold tracking-[-0.04em] leading-none tabular-nums" style={{ color }}>
            {running ? "…" : fmtScore(score)}
          </div>
          <div className="text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-faint)] mt-1.5">
            reliability score
          </div>
          {delta != null && !running ? (
            <div
              className="mono text-[12px] font-medium mt-1.5"
              style={{ color: delta >= 0 ? "var(--ok)" : "var(--bad)" }}
            >
              {fmtDelta(delta)} vs previous
            </div>
          ) : null}
        </div>
      </div>

      {ev.regressions && ev.regressions.newCount > 0 ? (
        <div className="panel p-4 mb-5 flex items-center gap-3.5" style={{ borderColor: "rgba(240,98,111,0.3)" }}>
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(240,98,111,0.1)", border: "1px solid rgba(240,98,111,0.25)" }}
          >
            <IconAlert size={15} className="text-[var(--bad)]" />
          </span>
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold text-white">
              {ev.regressions.newCount} new failure{ev.regressions.newCount > 1 ? "s" : ""} since last version
            </div>
            <div className="text-[12px] text-[var(--text-dim)] mt-0.5">
              {ev.regressions.categories.map((c) => CATEGORY_LABEL[c as Category]).filter(Boolean).join(" · ") || "no category changes"}
            </div>
          </div>
          {ev.regressions.fixedCount > 0 ? (
            <span className="tag tag-ok ml-auto shrink-0">{ev.regressions.fixedCount} fixed</span>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-8 space-y-5">
          <div className="panel p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="label">Pipeline</div>
              {running ? (
                <span className="tag tag-accent flex items-center gap-1.5">
                  <IconSpinner size={11} />
                  {ev.stage.toLowerCase()}
                </span>
              ) : (
                <span className="tag tag-ok flex items-center gap-1.5">
                  <IconCheck size={11} />
                  complete
                </span>
              )}
            </div>
            <div className="flex items-center">
              {STAGES.map((s, i) => {
                const done = i < stageIdx;
                const active = i === stageIdx && running;
                return (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors duration-300 ${
                          done
                            ? "bg-[rgba(76,208,140,0.12)] border-[rgba(76,208,140,0.35)] text-[var(--ok)]"
                            : active
                              ? "bg-[rgba(139,147,255,0.12)] border-[rgba(139,147,255,0.4)] text-[var(--accent-soft)] animate-pulse-soft"
                              : "bg-[var(--bg-elev)] border-[var(--line-strong)] text-[var(--text-faint)]"
                        }`}
                      >
                        {done ? <IconCheck size={12} /> : active ? <IconSpinner size={12} /> : <span className="mono text-[10px]">{i + 1}</span>}
                      </span>
                      <span className={`mono text-[9.5px] uppercase tracking-[0.06em] ${done || active ? "text-[var(--text-dim)]" : "text-[var(--text-faint)]"}`}>
                        {s === "COMPLETE" ? "scored" : s.toLowerCase()}
                      </span>
                    </div>
                    {i < STAGES.length - 1 ? (
                      <div className="h-px flex-1 mx-1 mb-4 -mt-3 bg-[var(--line)] overflow-hidden rounded">
                        <div
                          className="h-full bg-[rgba(139,147,255,0.5)] transition-transform duration-500 origin-left"
                          style={{ transform: `scaleX(${done ? 1 : 0})` }}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {running && ev.log.length > 0 ? (
              <div className="mt-4 pt-3 hairline-t space-y-1">
                {ev.log.slice(0, 6).map((l, i) => (
                  <div key={i} className="mono text-[11px] text-[var(--text-faint)] flex items-center gap-2">
                    <IconTerminal size={10} className="shrink-0" />
                    {l}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="panel p-5">
            <div className="label mb-4">Scenarios</div>
            <div className="flex items-center gap-1 mb-4">
              {(["ALL", "FAIL", "PASS"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`h-7 px-3 rounded-md text-[12px] font-medium transition-colors duration-150 ${
                    filter === f ? "bg-white/[0.07] text-white" : "text-[var(--text-dim)] hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {f === "ALL" ? "All" : f === "FAIL" ? "Failed" : "Passed"}
                  <span className="mono text-[10px] ml-1.5 opacity-60">
                    {f === "ALL" ? ev.runResults.length : f === "FAIL" ? ev.failedCount : ev.passedCount}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-1">
              {rows.map((r) => {
                const isOpen = !!open[r.id];
                const fail = r.verdict === "FAIL";
                return (
                  <div key={r.id} className="rounded-lg row-link overflow-hidden">
                    <button
                      onClick={() => setOpen((o) => ({ ...o, [r.id]: !o[r.id] }))}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                    >
                      <span
                        className={`dot shrink-0 ${fail ? "" : ""}`}
                        style={{ background: fail ? "var(--bad)" : "var(--ok)" }}
                      />
                      <span className="text-[12.5px] text-[var(--text)] truncate flex-1">{r.title}</span>
                      <span className="tag tag-faint hidden sm:inline-flex">{CATEGORY_LABEL[r.category as Category] ?? r.category}</span>
                      <span className={`tag ${fail ? `tag-${severityTone(r.severity)}` : "tag-ok"}`}>{fail ? r.severity : "pass"}</span>
                      <span className="mono text-[10px] text-[var(--text-faint)] w-12 text-right">{r.durationMs}ms</span>
                      {isOpen ? <IconChevronDown size={12} className="text-[var(--text-faint)]" /> : <IconChevronRight size={12} className="text-[var(--text-faint)]" />}
                    </button>

                    {isOpen ? (
                      <div className="px-4 pb-4 pt-1 animate-fade-in">
                        <div className="space-y-3">
                          <div>
                            <div className="label mb-1.5">Attack</div>
                            <div className="panel-inset px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--text)]">
                              {r.userTurn}
                            </div>
                          </div>
                          <div>
                            <div className="label mb-1.5">Expected</div>
                            <div className="text-[12.5px] leading-relaxed text-[var(--text-dim)]">{r.expected}</div>
                          </div>

                          {fail ? (
                            <div>
                              <div className="label mb-1.5">Why it failed</div>
                              <div
                                className="panel-inset px-3.5 py-2.5 text-[12.5px] leading-relaxed"
                                style={{ color: "#FF98A0", borderColor: "rgba(240,98,111,0.25)" }}
                              >
                                {r.failureDetail}
                              </div>

                              {(() => {
                                const fix = fixFor(r.failureKind as FailureKind | null);
                                if (!fix) return null;
                                return (
                                  <div className="mt-2.5 panel-inset px-3.5 py-2.5" style={{ borderColor: "rgba(139,147,255,0.22)" }}>
                                    <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--accent-soft)] mb-1">
                                      <IconWand size={11} />
                                      Suggested fix
                                    </div>
                                    <div className="text-[12.5px] text-[var(--text)] mono leading-relaxed break-words">
                                      {fix.promptRule}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : null}

                          <div>
                            <div className="label mb-1.5">Transcript</div>
                            <div className="panel-inset p-3.5">
                              <TranscriptViewer steps={r.steps} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {rows.length === 0 ? (
                <div className="text-[12.5px] text-[var(--text-faint)] py-6 text-center">
                  {filter === "FAIL" ? "No failures. Clean run." : "No scenarios."}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-5">
          <div className="panel p-5">
            <div className="label mb-3.5">Summary</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Stat label="passed" value={ev.passedCount} sub={`of ${ev.scenarioCount}`} />
              <Stat label="failed" value={<span style={{ color: "var(--bad)" }}>{ev.failedCount}</span>} />
              <Stat label="duration" value={fmtMs(ev.durationMs)} />
              <Stat label="mode" value="sandbox" />
            </div>
          </div>

          {ev.failuresByCategory ? (
            <div className="panel p-5">
              <div className="label mb-3.5">Failure breakdown</div>
              <CategoryBars data={ev.failuresByCategory} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
