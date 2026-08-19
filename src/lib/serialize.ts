import type { EvaluationDto, RunResultDto } from "./client";

type EvalRecord = {
  id: string;
  status: string;
  stage: string;
  log: unknown;
  score: number | null;
  previousScore: number | null;
  scoreDelta: number | null;
  scenarioCount: number;
  passedCount: number;
  failedCount: number;
  mode: string;
  createdAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  regressions: unknown;
  failuresByCategory: unknown;
  meta: unknown;
  vsEvaluationId: string | null;
  agent: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    systemPrompt: string;
    createdAt: Date;
    tools: {
      id: string;
      name: string;
      description: string;
      destructive: boolean;
      requiresApproval: boolean;
      params: unknown;
    }[];
  };
  agentVersion: { id: string; number: number; label: string | null; prompt: string } | null;
  runResults: {
    id: string;
    sequence: number;
    scenarioKey: string;
    category: string;
    severity: string;
    title: string;
    userTurn: string;
    expected: string;
    verdict: string;
    failureKind: string | null;
    failureTitle: string | null;
    failureDetail: string | null;
    steps: unknown;
    context: unknown;
    durationMs: number;
  }[];
};

export function serializeEvaluation(e: EvalRecord): EvaluationDto {
  return {
    id: e.id,
    status: e.status,
    stage: e.stage,
    log: Array.isArray(e.log) ? (e.log as string[]) : [],
    score: e.score,
    previousScore: e.previousScore,
    scoreDelta: e.scoreDelta,
    scenarioCount: e.scenarioCount,
    passedCount: e.passedCount,
    failedCount: e.failedCount,
    mode: e.mode,
    createdAt: e.createdAt.toISOString(),
    finishedAt: e.finishedAt ? e.finishedAt.toISOString() : null,
    durationMs: e.durationMs,
    regressions: e.regressions as EvaluationDto["regressions"],
    failuresByCategory: e.failuresByCategory as EvaluationDto["failuresByCategory"],
    meta: e.meta as EvaluationDto["meta"],
    vsEvaluationId: e.vsEvaluationId,
    agent: {
      id: e.agent.id,
      slug: e.agent.slug,
      name: e.agent.name,
      description: e.agent.description,
      systemPrompt: e.agent.systemPrompt,
      createdAt: e.agent.createdAt.toISOString(),
      tools: e.agent.tools.map((t) => ({
        name: t.name,
        description: t.description,
        destructive: t.destructive,
        params: t.params as Record<string, { type: string; description?: string }>,
      })),
      versions: [],
      evaluations: [],
    },
    agentVersion: e.agentVersion
      ? { id: e.agentVersion.id, number: e.agentVersion.number, label: e.agentVersion.label, prompt: e.agentVersion.prompt }
      : null,
    runResults: e.runResults.map((r) => ({
      id: r.id,
      sequence: r.sequence,
      scenarioKey: r.scenarioKey,
      category: r.category,
      severity: r.severity,
      title: r.title,
      userTurn: r.userTurn,
      expected: r.expected,
      verdict: r.verdict as RunResultDto["verdict"],
      failureKind: r.failureKind,
      failureTitle: r.failureTitle,
      failureDetail: r.failureDetail,
      steps: r.steps as RunResultDto["steps"],
      context: r.context as RunResultDto["context"],
      durationMs: r.durationMs,
    })),
  };
}
