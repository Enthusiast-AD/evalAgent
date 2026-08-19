import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEvaluation } from "@/lib/store";
import { serializeEvaluation } from "@/lib/serialize";
import { ScoreRing, CategoryBars, VersionArc, bandColor, bandLabel } from "@/components/ui";
import { ExportJsonButton } from "@/components/export-button";
import { fmtDelta, fmtMs, fmtScore } from "@/lib/client";
import { fixFor } from "@/engine/actionable";
import { detectDomain, DOMAIN_INFO } from "@/engine/domain";
import { CATEGORY_LABEL, FAILURE_LABEL, type Category, type FailureKind } from "@/engine/types";
import { IconAlert, IconChevronLeft, IconWand } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const evaluation = await getEvaluation(id);
  if (!evaluation) notFound();

  const ev = serializeEvaluation(evaluation);
  const score = ev.score ?? 0;
  const failures = ev.runResults.filter((r) => r.verdict === "FAIL");

  const taxonomy = new Map<string, { count: number; severities: Set<string>; example: string }>();
  for (const f of failures) {
    const kind = f.failureKind ?? "destructive-action";
    const entry = taxonomy.get(kind) ?? { count: 0, severities: new Set<string>(), example: f.title };
    entry.count++;
    entry.severities.add(f.severity);
    taxonomy.set(kind, entry);
  }

  const domain = detectDomain(evaluation.agent.systemPrompt);
  const versions = await prisma.agentVersion.findMany({
    where: { agentId: evaluation.agentId },
    orderBy: { number: "asc" },
    include: { evaluation: true },
  });

  return (
    <div className="max-w-[960px] mx-auto px-8 py-10 print:max-w-none print:px-0">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href={`/evaluations/${ev.id}`} className="link flex items-center gap-1.5 text-[12.5px]">
          <IconChevronLeft size={12} />
          Back to scan
        </Link>
        <div className="flex items-center gap-2">
          <ExportJsonButton data={ev} filename={`agentguard-${ev.agent.slug}-${ev.id.slice(-8)}.json`} />
        </div>
      </div>

      <div className="flex items-start justify-between gap-8 border-b border-[var(--line)] pb-7">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-[var(--text-faint)] mb-2.5">
            <span className="text-[var(--text-dim)] font-medium">{ev.agent.name}</span>
            {ev.agentVersion?.label ? <span className="tag tag-accent">{ev.agentVersion.label}</span> : null}
            <span className="tag">{ev.mode === "llm" ? "live gemini agent" : "sandbox simulator"}</span>
            <span className="mono text-[10.5px]">scan {ev.id.slice(-8)}</span>
          </div>
          <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-white leading-none">Reliability report</h1>
          <p className="text-[13px] text-[var(--text-dim)] mt-2 max-w-[520px] leading-relaxed">
            {ev.agent.description ?? "No description."} Task domain detected: <span className="text-white">{DOMAIN_INFO[domain].label}</span>.
          </p>
        </div>
        <div className="text-right">
          <ScoreRing size={132} score={score} />
          {ev.scoreDelta != null ? (
            <div className="mono text-[12.5px] font-medium mt-2" style={{ color: ev.scoreDelta >= 0 ? "var(--ok)" : "var(--bad)" }}>
              {fmtDelta(ev.scoreDelta)} vs previous
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-px rounded-[12px] overflow-hidden border border-[var(--line)] bg-[var(--line)] my-6">
        {[
          { label: "Scenarios", value: ev.scenarioCount },
          { label: "Passed", value: ev.passedCount },
          { label: "Failed", value: ev.failedCount },
          { label: "Duration", value: fmtMs(ev.durationMs) },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--bg)] px-5 py-4">
            <div className="label mb-1">{s.label}</div>
            <div className="text-[17px] font-semibold tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="panel p-4 mb-6 flex items-center gap-3.5">
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(242,184,92,0.1)", border: "1px solid rgba(242,184,92,0.25)" }}
        >
          <IconAlert size={15} className="text-[var(--warn)]" />
        </span>
        <div className="text-[12.5px] text-[var(--text-dim)] leading-relaxed">
          Industry benchmarks report autonomous agents failing{" "}
          <span className="text-white font-medium">roughly 70% of real-world tasks</span>. This agent scores{" "}
          <span className="font-semibold" style={{ color: bandColor(score) }}>
            {fmtScore(score)}/100
          </span>{" "}
          against an adversarial suite of {ev.scenarioCount} scenarios.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-6 print:grid-cols-1">
        <div className="panel p-5">
          <div className="label mb-3.5">Failure breakdown</div>
          {ev.failuresByCategory ? (
            <CategoryBars data={ev.failuresByCategory} />
          ) : (
            <div className="text-[12.5px] text-[var(--text-faint)]">No failures recorded.</div>
          )}
        </div>
        <div className="panel p-5">
          <div className="label mb-3.5">Failure taxonomy</div>
          {taxonomy.size === 0 ? (
            <div className="text-[12.5px] text-[var(--ok)]">No failures. This agent passed every scenario.</div>
          ) : (
            <div className="space-y-2.5">
              {[...taxonomy.entries()].map(([kind, t]) => {
                const fix = fixFor(kind as FailureKind);
                return (
                  <div key={kind} className="flex items-start gap-3">
                    <span className="tag tag-bad shrink-0 mt-0.5">{t.count}</span>
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-medium text-white">{FAILURE_LABEL[kind as FailureKind] ?? kind}</div>
                      <div className="text-[11.5px] text-[var(--text-faint)] truncate mt-0.5">{t.example}</div>
                      {fix ? (
                        <div className="flex items-start gap-1.5 mt-1.5 text-[11.5px] text-[var(--accent-soft)] leading-relaxed">
                          <IconWand size={10} className="mt-0.5 shrink-0" />
                          <span>
                            <span className="font-semibold">Suggested fix · </span>
                            <span className="mono break-words">{fix.promptRule}</span>
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {versions.length > 1 ? (
        <div className="panel p-5 mb-6">
          <div className="label mb-2">Reliability by version</div>
          <VersionArc
            versions={versions.map((v) => ({ label: v.label, number: v.number, evaluation: v.evaluation }))}
          />
        </div>
      ) : null}

      <div className="panel overflow-hidden">
        <div className="px-4 py-3 hairline-b flex items-center justify-between">
          <span className="label">Scenario results</span>
          <span className="mono text-[10.5px] text-[var(--text-faint)]">{ev.scenarioCount} total</span>
        </div>
        <div>
          {ev.runResults.map((r) => {
            const fail = r.verdict === "FAIL";
            const fix = fixFor(r.failureKind as FailureKind | null);
            return (
              <div key={r.id} className="px-4 py-3 hairline-b last:border-0">
                <div className="flex items-center gap-3">
                  <span className="dot shrink-0" style={{ background: fail ? "var(--bad)" : "var(--ok)" }} />
                  <span className="text-[12.5px] text-[var(--text)] flex-1 min-w-0 truncate">{r.title}</span>
                  <span className="tag tag-faint hidden sm:inline-flex">{CATEGORY_LABEL[r.category as Category] ?? r.category}</span>
                  <span className="tag tag-faint">{r.severity}</span>
                  <span className={`mono text-[10.5px] font-medium ${fail ? "text-[var(--bad)]" : "text-[var(--ok)]"}`}>
                    {r.verdict}
                  </span>
                </div>
                {fail && r.failureDetail ? (
                  <div className="mt-2 pl-[18px]">
                    <div className="text-[12px] text-[var(--text-dim)] leading-relaxed">{r.failureDetail}</div>
                    {fix ? (
                      <div className="flex items-start gap-1.5 mt-1.5 text-[11.5px] text-[var(--accent-soft)] leading-relaxed">
                        <IconWand size={10} className="mt-0.5 shrink-0" />
                        <span>
                          <span className="font-semibold">Suggested fix · </span>
                          <span className="mono break-words">{fix.promptRule}</span>
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 text-center text-[11px] text-[var(--text-faint)] mono">
        agentguard · reliability report · {ev.agent.name} {ev.agentVersion?.label ?? ""} · {ev.createdAt.slice(0, 10)}
      </div>
    </div>
  );
}
