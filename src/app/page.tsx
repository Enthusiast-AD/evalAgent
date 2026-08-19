import Link from "next/link";
import { listAgents } from "@/lib/store";
import { ShaderField } from "@/components/shader";
import { RunScanButton } from "@/components/run-scan-button";
import { IconArrowRight, IconBot, IconDatabase, IconPulse, IconSearch, IconSpark, IconTerminal } from "@/components/icons";
import { Sparkline, bandColor, bandLabel, Stat } from "@/components/ui";
import { fmtDelta, fmtScore } from "@/lib/client";

const STAGES = [
  { icon: <IconSpark size={15} />, title: "Scenario generator", desc: "adversarial cases from your tool schema", code: "gen" },
  { icon: <IconDatabase size={15} />, title: "Sandbox executor", desc: "mock tools, records, loop guard", code: "sandbox" },
  { icon: <IconSearch size={15} />, title: "Failure analyzer", desc: "why it failed, severity, evidence", code: "analyze" },
  { icon: <IconPulse size={15} />, title: "Reliability score", desc: "weighted score + regressions", code: "score" },
];

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const agents = await listAgents();

  return (
    <div>
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <ShaderField className="absolute inset-0 w-full h-full opacity-90" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 90% at 50% 120%, rgba(11,12,14,0) 30%, rgba(11,12,14,0.85) 100%)",
          }}
        />
        <div className="relative max-w-[1180px] mx-auto px-8 pt-16 pb-12">
          <div className="flex items-center gap-2 mb-5">
            <span className="tag tag-accent">
              <span className="dot" style={{ background: "var(--accent)" }} />
              reliability engine for agents
            </span>
          </div>
          <h1 className="text-[38px] font-semibold leading-[1.06] tracking-[-0.035em] text-white max-w-[560px]">
            The CI/CD pipeline for AI agents.
          </h1>
          <p className="text-[15px] text-[var(--text-dim)] mt-3 max-w-[520px] leading-relaxed">
            AgentGuard generates adversarial scenarios, executes your agent in an isolated sandbox, and turns failures
            into a reliability score you can track across every prompt change.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <Link href="/new" className="btn btn-primary btn-lg">
              <IconBot size={15} />
              Add your agent
            </Link>
            <a href="#agents" className="btn btn-lg">
              View agents
              <IconArrowRight size={14} />
            </a>
          </div>

          <div className="mt-12 grid grid-cols-4 gap-px rounded-[12px] overflow-hidden border border-[var(--line)] bg-[var(--line)] shadow-card">
            {STAGES.map((s, i) => (
              <div key={s.title} className="relative bg-[rgba(19,20,24,0.82)] backdrop-blur px-5 py-4">
                {i < STAGES.length - 1 ? (
                  <span className="absolute top-1/2 -right-[13px] -translate-y-1/2 z-10 text-[var(--text-faint)]">
                    <IconArrowRight size={11} />
                  </span>
                ) : null}
                <div className="flex items-center gap-2 text-white font-medium text-[13px]">
                  <span className="text-[var(--accent-soft)]">{s.icon}</span>
                  {s.title}
                </div>
                <div className="text-[11.5px] text-[var(--text-dim)] mt-1 leading-snug">{s.desc}</div>
                <div className="mono text-[10px] text-[var(--text-faint)] mt-2">agentguard/{s.code}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="agents" className="max-w-[1180px] mx-auto px-8 py-10">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-white">Agents</h2>
            <p className="text-[12.5px] text-[var(--text-dim)] mt-0.5">
              {agents.length} tracked · reliability computed from adversarial runs
            </p>
          </div>
          <Link href="/new" className="btn btn-sm">
            New agent
          </Link>
        </div>

        <div className="fade-stagger grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((a) => {
            const latest = a.evaluations[0];
            const prev = a.evaluations[1];
            const delta = latest?.score != null && prev?.score != null ? Math.round((latest.score - prev.score) * 10) / 10 : null;
            const arc = a.versions.filter((v) => v.evaluation?.score != null).map((v) => v.evaluation!.score!);
            const score = latest?.score ?? null;
            const color = score != null ? bandColor(score) : "var(--text-faint)";

            return (
              <Link
                key={a.id}
                href={`/agents/${a.slug}`}
                className="panel p-5 group relative overflow-hidden hover:border-[var(--line-strong)] transition-colors duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0"
                        style={{ background: "rgba(139,147,255,0.12)", border: "1px solid rgba(139,147,255,0.25)" }}
                      >
                        <IconBot size={14} className="text-[var(--accent-soft)]" />
                      </span>
                      <h3 className="text-[14.5px] font-semibold text-white tracking-[-0.01em] truncate">{a.name}</h3>
                    </div>
                    <p className="text-[12.5px] text-[var(--text-dim)] mt-2 leading-relaxed line-clamp-2">{a.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="mono text-[22px] font-semibold tabular-nums tracking-[-0.03em]" style={{ color }}>
                      {fmtScore(score)}
                    </div>
                    <div className="text-[10.5px] text-[var(--text-faint)] mt-0.5">
                      {score != null ? bandLabel(score) : "not scanned"}
                    </div>
                    {delta != null ? (
                      <div
                        className="mono text-[10.5px] mt-0.5 font-medium"
                        style={{ color: delta >= 0 ? "var(--ok)" : "var(--bad)" }}
                      >
                        {fmtDelta(delta)} vs prev
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-end justify-between gap-4 mt-4 pt-4 border-t border-[var(--line)]">
                  <div className="flex items-end gap-3">
                    <Sparkline values={arc} width={130} height={30} />
                    <span className="mono text-[10px] text-[var(--text-faint)] pb-0.5">{arc.length || 0} runs</span>
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mr-1 -mb-1">
                    <RunScanButton slug={a.slug} />
                  </span>
                </div>
              </Link>
            );
          })}

          <Link
            href="/new"
            className="panel p-5 border-dashed flex flex-col items-center justify-center min-h-[150px] group transition-colors duration-200 hover:border-[var(--line-strong)]"
          >
            <span className="w-8 h-8 rounded-[9px] border border-[var(--line-strong)] flex items-center justify-center text-[var(--text-faint)] group-hover:text-white group-hover:border-white/30 transition-colors duration-200">
              <IconTerminal size={15} />
            </span>
            <span className="text-[13px] font-medium text-[var(--text-dim)] mt-3 group-hover:text-white transition-colors duration-200">
              Register a new agent
            </span>
            <span className="text-[11.5px] text-[var(--text-faint)] mt-1">define tools, set the prompt, run a scan</span>
          </Link>
        </div>
      </section>

      <section className="max-w-[1180px] mx-auto px-8 pb-16">
        <div className="grid grid-cols-3 gap-px rounded-[12px] overflow-hidden border border-[var(--line)] bg-[var(--line)]">
          {[
            { label: "scenarios", value: "11 categories" },
            { label: "categories", value: "injection · drift · hallucination" },
            { label: "mode", value: "deterministic sandbox" },
          ].map((s) => (
            <div key={s.label} className="bg-[var(--bg)] px-6 py-5">
              <Stat label={s.label} value={<span className="text-[16px]">{s.value}</span>} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
