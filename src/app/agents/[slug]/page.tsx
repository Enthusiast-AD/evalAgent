import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AgentWorkspace } from "@/components/agent-workspace";
import { ScoreRing, VersionArc, CategoryBars, Stat, CategoryTrend } from "@/components/ui";
import { RunScanButton } from "@/components/run-scan-button";
import { fmtDelta, fmtMs, fmtScore } from "@/lib/client";
import { IconBot, IconShield, IconChevronRight } from "@/components/icons";
import { CATEGORY_LABEL } from "@/engine/types";

export const dynamic = "force-dynamic";

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const agent = await prisma.agent.findUnique({
    where: { slug },
    include: {
      tools: { orderBy: { position: "asc" } },
      versions: { orderBy: { number: "asc" }, include: { evaluation: true } },
    },
  });
  if (!agent) notFound();

  const latestVersion = agent.versions.filter((v) => v.evaluation).at(-1) ?? null;
  const latest = latestVersion?.evaluation ?? null;
  const latestResults = latest
    ? await prisma.runResult.findMany({ where: { evaluationId: latest.id }, orderBy: { sequence: "asc" } })
    : [];
  const prevOfLatest = latest?.vsEvaluationId
    ? await prisma.evaluation.findUnique({ where: { id: latest.vsEvaluationId } })
    : null;

  const delta =
    latest?.score != null && prevOfLatest?.score != null ? Math.round((latest.score - prevOfLatest.score) * 10) / 10 : null;

  const nextVersionLabel = `v${((agent.versions.at(-1)?.number ?? 0) + 1).toFixed(1)}`;
  const versionsScored = agent.versions.filter((v) => v.evaluation?.score != null);
  const currentLabel = latestVersion?.label ?? null;
  const failures = latestResults.filter((r) => r.verdict === "FAIL");
  const breakdown = (latest?.failuresByCategory as Record<string, { total: number; failed: number }>) ?? null;
  const geminiAvailable = !!process.env.GEMINI_API_KEY;

  const categoryHistory = await prisma.evaluation.findMany({
    where: { agentId: agent.id, status: "COMPLETE", failuresByCategory: { not: {} } },
    orderBy: { createdAt: "asc" },
    select: { id: true, createdAt: true, failuresByCategory: true },
    take: 8,
  });
  const trendRows = agent.versions
    .map((v) => ({
      label: v.label ?? `v${v.number}`,
      data: (v.evaluation?.failuresByCategory as Record<string, { total: number; failed: number }>) ?? null,
    }))
    .filter((v) => v.data);
  const trendCategories = [...new Set(trendRows.flatMap((r) => Object.keys(r.data ?? {})))];

  return (
    <div className="max-w-[1180px] mx-auto px-8 py-8">
      <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-faint)] mb-5">
        <Link href="/" className="link">Agents</Link>
        <IconChevronRight size={11} />
        <span className="text-[var(--text-dim)]">{agent.name}</span>
      </div>

      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span
              className="w-9 h-9 rounded-[9px] flex items-center justify-center"
              style={{ background: "rgba(139,147,255,0.12)", border: "1px solid rgba(139,147,255,0.25)" }}
            >
              <IconBot size={17} className="text-[var(--accent-soft)]" />
            </span>
            <div>
              <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-white leading-none">{agent.name}</h1>
              <p className="text-[12.5px] text-[var(--text-dim)] mt-1.5">{agent.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3.5">
            <span className="tag">
              <IconShield size={11} />
              {agent.tools.length} tools
            </span>
            <span className="tag">{agent.tools.filter((t) => t.destructive).length} destructive</span>
            {currentLabel ? <span className="tag tag-accent">current: {currentLabel}</span> : null}
          </div>
        </div>
        <RunScanButton slug={agent.slug} prompt={agent.systemPrompt}>
          Run scan
        </RunScanButton>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-7 space-y-5">
          <AgentWorkspace
            slug={agent.slug}
            initialPrompt={agent.systemPrompt}
            nextVersionLabel={nextVersionLabel}
            geminiAvailable={geminiAvailable}
          />

          <div className="panel p-5">
            <div className="label mb-3.5">Tool registry</div>
            <div className="space-y-1">
              {agent.tools.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-2.5 py-2 rounded-lg row-link">
                  <span
                    className={`mono text-[11.5px] font-medium ${t.destructive ? "text-[var(--bad)]" : "text-[var(--accent-soft)]"}`}
                  >
                    {t.name}
                  </span>
                  <span className="text-[12px] text-[var(--text-dim)] truncate">{t.description}</span>
                  <span className="ml-auto flex items-center gap-1.5 shrink-0">
                    {t.destructive ? <span className="tag tag-bad">destructive</span> : null}
                    {t.requiresApproval ? <span className="tag tag-warn">approval</span> : null}
                    <span className="mono text-[10px] text-[var(--text-faint)]">
                      {Object.keys(t.params as object).length} params
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-5 space-y-5">
          <div className="panel p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="label mb-1">Reliability</div>
                <div className="text-[12px] text-[var(--text-dim)]">
                  {latest ? (
                    <>
                      {latest.passedCount}/{latest.scenarioCount} scenarios passed
                    </>
                  ) : (
                    "no scan yet"
                  )}
                </div>
              </div>
              <ScoreRing size={104} score={latest?.score ?? 0} />
            </div>

            {latest ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 mt-5 pt-4 hairline-t">
                <Stat label="failed" value={<span style={{ color: "var(--bad)" }}>{latest.failedCount}</span>} sub={`${latest.failedCount} failures`} />
                <Stat label="duration" value={fmtMs(latest.durationMs)} sub="sandbox wall time" />
                <Stat label="previous" value={latest.previousScore != null ? fmtScore(latest.previousScore) : "-"} sub="last version" />
                <Stat
                  label="delta"
                  value={
                    delta != null ? (
                      <span style={{ color: delta >= 0 ? "var(--ok)" : "var(--bad)" }}>{fmtDelta(delta)}</span>
                    ) : (
                      "-"
                    )
                  }
                  sub={delta != null ? "vs previous" : "baseline"}
                />
              </div>
            ) : (
              <div className="mt-5 pt-4 hairline-t text-[12px] text-[var(--text-faint)]">
                Register this agent and run a scan to get a baseline reliability score.
              </div>
            )}
          </div>

          {versionsScored.length > 1 ? (
            <div className="panel p-5">
              <div className="label mb-2">Reliability by version</div>
              <VersionArc
                versions={agent.versions.map((v) => ({
                  label: v.label,
                  number: v.number,
                  evaluation: v.evaluation,
                }))}
              />
            </div>
          ) : null}

          {trendRows.length >= 2 ? (
            <div className="panel p-5">
              <div className="label mb-3">Category trend</div>
              <CategoryTrend versions={trendRows} categories={trendCategories} />
            </div>
          ) : null}

          {breakdown ? (
            <div className="panel p-5">
              <div className="label mb-3.5">Failure breakdown</div>
              <CategoryBars data={breakdown} />
            </div>
          ) : null}

          {failures.length > 0 ? (
            <div className="panel p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="label">Latest failures</div>
                <span className="tag tag-bad">{failures.length}</span>
              </div>
              <div className="space-y-1">
                {failures.slice(0, 5).map((f) => (
                  <Link
                    key={f.id}
                    href={`/evaluations/${latest?.id}`}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg row-link group"
                  >
                    <span className="dot" style={{ background: "var(--bad)" }} />
                    <span className="text-[12.5px] text-[var(--text-dim)] truncate">{f.title}</span>
                    <span className="tag tag-bad shrink-0 ml-auto">{f.severity}</span>
                    <IconChevronRight size={11} className="text-[var(--text-faint)]" />
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
