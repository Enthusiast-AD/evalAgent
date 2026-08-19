import { IconDatabase, IconPulse, IconSearch, IconSpark, IconTerminal } from "@/components/icons";

const STAGES = [
  {
    icon: <IconSpark size={16} />,
    stage: "01 · Scenario generation",
    title: "Adversarial cases derived from your tool schema",
    body: "Each tool in your registry is analyzed for risk. Destructive actions (refunds, transfers, cancellations) generate injection, verification, limit, and duplicate-refund cases. Read tools generate hallucination and cross-account probes. The result is a scenario suite that adapts to your agent instead of a static test list.",
    points: ["prompt injection", "indirect injection via tool data", "identity verification", "amount and limit validation", "duplicate action detection"],
  },
  {
    icon: <IconDatabase size={16} />,
    stage: "02 · Sandbox execution",
    title: "Your agent runs against mocked reality",
    body: "Every scenario executes inside a controlled sandbox: mock tools, seeded records, and a loop guard. The runtime records every decision, tool call, and outcome into a full transcript.",
    points: ["mock tool environment", "seeded records and context", "identical-call loop guard", "step cap with sys notes", "full transcript capture"],
  },
  {
    icon: <IconSearch size={16} />,
    stage: "03 · Failure analysis",
    title: "Every failure is classified and evidenced",
    body: "The analyzer inspects the transcript against each scenario's assertion. Failures are typed - injection, hallucination, goal drift, fabricated success, tool misuse - with the exact tool call or reply that caused them attached as evidence.",
    points: ["assertion-based verdicts", "11 failure categories", "severity per scenario", "human-readable evidence", "refusal quality checks"],
  },
  {
    icon: <IconPulse size={16} />,
    stage: "04 · Reliability scoring",
    title: "A single number you can move with a prompt edit",
    body: "Passing scenarios are weighted by severity into a reliability score. Every run is compared against the previous one to surface regressions: new failures, fixed failures, and affected categories.",
    points: ["severity-weighted score", "regression comparison", "per-category breakdown", "score delta vs previous", "version history"],
  },
];

export default function PipelinePage() {
  return (
    <div className="max-w-[900px] mx-auto px-8 py-10">
      <div className="flex items-center gap-2.5 mb-2">
        <IconTerminal size={16} className="text-[var(--accent-soft)]" />
        <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-white">Pipeline</h1>
      </div>
      <p className="text-[13.5px] text-[var(--text-dim)] max-w-[640px] leading-relaxed">
        A run moves through four stages. Every stage is deterministic, so the same prompt always produces the same
        score - which is what makes regressions meaningful.
      </p>

      <div className="mt-8 space-y-4">
        {STAGES.map((s) => (
          <div key={s.stage} className="panel p-6 grid grid-cols-[1fr_auto] gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-[rgba(139,147,255,0.12)] border border-[rgba(139,147,255,0.25)] text-[var(--accent-soft)]">
                  {s.icon}
                </span>
                <span className="mono text-[10.5px] uppercase tracking-[0.07em] text-[var(--text-faint)]">{s.stage}</span>
              </div>
              <h2 className="text-[15.5px] font-semibold text-white tracking-[-0.015em] mt-2">{s.title}</h2>
              <p className="text-[13px] text-[var(--text-dim)] leading-relaxed mt-2">{s.body}</p>
            </div>
            <div className="w-[210px] shrink-0">
              <div className="label mb-2">checks</div>
              <div className="flex flex-wrap gap-1.5">
                {s.points.map((p) => (
                  <span key={p} className="tag tag-faint">{p}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
