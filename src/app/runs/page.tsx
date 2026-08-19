import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { IconChevronRight, IconPulse } from "@/components/icons";
import { fmtDelta, fmtMs, fmtScore } from "@/lib/client";
import { bandColor } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function RunsPage() {
  const runs = await prisma.evaluation.findMany({
    where: { status: "COMPLETE" },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { agent: true, agentVersion: true },
  });

  return (
    <div className="max-w-[1180px] mx-auto px-8 py-10">
      <div className="flex items-center gap-2.5 mb-6">
        <IconPulse size={16} className="text-[var(--accent-soft)]" />
        <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-white">Scans</h1>
        <span className="tag ml-1">{runs.length} runs</span>
      </div>

      <div className="panel overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-2.5 hairline-b bg-[var(--bg-elev)] text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--text-faint)]">
          <div className="col-span-4">Agent</div>
          <div className="col-span-2">Version</div>
          <div className="col-span-2">Score</div>
          <div className="col-span-2">Delta</div>
          <div className="col-span-2 text-right">Run</div>
        </div>
        <div>
          {runs.map((r) => {
            const score = r.score ?? 0;
            return (
              <Link
                key={r.id}
                href={`/evaluations/${r.id}`}
                className="grid grid-cols-12 items-center px-4 py-3 hairline-b last:border-0 row-link"
              >
                <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                  <span className="text-[13px] font-medium text-white truncate">{r.agent.name}</span>
                </div>
                <div className="col-span-2">
                  <span className="tag">{r.agentVersion?.label ?? "latest"}</span>
                </div>
                <div className="col-span-2">
                  <span className="mono text-[13px] font-semibold tabular-nums" style={{ color: bandColor(score) }}>
                    {fmtScore(score)}
                  </span>
                </div>
                <div className="col-span-2">
                  {r.scoreDelta != null ? (
                    <span className="mono text-[12px] font-medium" style={{ color: r.scoreDelta >= 0 ? "var(--ok)" : "var(--bad)" }}>
                      {fmtDelta(r.scoreDelta)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[var(--text-faint)]">baseline</span>
                  )}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2 text-[11px] text-[var(--text-faint)]">
                  {r.passedCount}/{r.scenarioCount} · {fmtMs(r.durationMs)}
                  <IconChevronRight size={11} />
                </div>
              </Link>
            );
          })}
          {runs.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-[var(--text-faint)]">No scans yet. Run one from an agent page.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
