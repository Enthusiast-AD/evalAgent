import { prisma } from "./prisma";
import { runEvaluation } from "@/engine/runner";
import { compareEvaluations } from "@/engine/scoring";
import type { ToolDef } from "@/engine/types";
import type { Evaluation } from "@prisma/client";

export function agentWithLatest(agentId: string) {
  return prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      tools: { orderBy: { position: "asc" } },
      versions: { orderBy: { number: "desc" } },
      evaluations: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export function listAgents() {
  return prisma.agent.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      tools: true,
      versions: { orderBy: { number: "asc" }, include: { evaluation: true } },
      evaluations: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
  });
}

export function getEvaluation(id: string) {
  return prisma.evaluation.findUnique({
    where: { id },
    include: {
      agent: { include: { tools: { orderBy: { position: "asc" } } } },
      agentVersion: true,
      runResults: { orderBy: { sequence: "asc" } },
    },
  });
}

export async function createEvaluationForAgent(opts: {
  agentId: string;
  prompt?: string;
  versionLabel?: string;
  mode?: "simulator" | "llm";
}): Promise<{ evaluation: Evaluation; versionId: string | null }> {
  const agent = await prisma.agent.findUnique({ where: { id: opts.agentId } });
  if (!agent) throw new Error("agent not found");

  const prompt = opts.prompt ?? agent.systemPrompt;
  const latest = await prisma.agentVersion.findFirst({
    where: { agentId: agent.id },
    orderBy: { number: "desc" },
  });
  const isOverride = opts.prompt !== undefined && opts.prompt !== agent.systemPrompt;
  const number = (latest?.number ?? 0) + 1;

  let versionId: string | null = null;
  if (isOverride || opts.versionLabel) {
    const version = await prisma.agentVersion.create({
      data: { agentId: agent.id, number, prompt, label: opts.versionLabel ?? null },
    });
    versionId = version.id;
  }

  const previous = await prisma.evaluation.findFirst({
    where: { agentId: agent.id, status: "COMPLETE" },
    orderBy: { createdAt: "desc" },
  });

  const evaluation = await prisma.evaluation.create({
    data: {
      agentId: agent.id,
      agentVersionId: versionId,
      mode: opts.mode ?? "simulator",
      status: "RUNNING",
      stage: "GENERATING",
      log: [],
      vsEvaluationId: previous?.id,
      previousScore: previous?.score,
    },
  });

  if (versionId && opts.prompt !== undefined) {
    await prisma.agent.update({ where: { id: agent.id }, data: { systemPrompt: opts.prompt } });
  }

  return { evaluation, versionId };
}

async function patch(id: string, data: Record<string, unknown>) {
  await prisma.evaluation.update({ where: { id }, data });
}

export async function processEvaluation(evaluationId: string): Promise<void> {
  const evaluation = await prisma.evaluation.findUnique({ where: { id: evaluationId } });
  if (!evaluation) return;

  const agent = await prisma.agent.findUnique({
    where: { id: evaluation.agentId },
    include: { tools: { orderBy: { position: "asc" } } },
  });
  if (!agent) return;

  const version = evaluation.agentVersionId
    ? await prisma.agentVersion.findUnique({ where: { id: evaluation.agentVersionId } })
    : null;
  const prompt = version?.prompt ?? agent.systemPrompt;
  const tools: ToolDef[] = agent.tools.map((t) => ({
    name: t.name,
    description: t.description,
    params: (t.params as Record<string, { type: "string" | "number" | "integer" | "boolean"; description?: string }>) ?? {},
    destructive: t.destructive,
    requiresApproval: t.requiresApproval,
  }));

  const log: string[] = [];
  const mode = (evaluation.mode as "simulator" | "llm") === "llm" ? "llm" : "simulator";
  await patch(evaluationId, { log, stage: "GENERATING" });

  const outcome = await runEvaluation(prompt, tools, { mode, log: (m) => log.push(m) });

  await patch(evaluationId, { log, stage: "COMPLETE", mode: outcome.mode });

  const previous = evaluation.vsEvaluationId
    ? await prisma.evaluation.findUnique({ where: { id: evaluation.vsEvaluationId } })
    : null;
  const prevResults = previous ? await prisma.runResult.findMany({ where: { evaluationId: previous.id } }) : [];
  const prevParsed = prevResults.map((r) => ({
    scenario: { key: r.scenarioKey, category: r.category, severity: r.severity } as never,
    verdict: r.verdict as never,
  }));

  const regression = previous ? compareEvaluations(prevParsed as never, outcome.results as never) : null;

  await prisma.runResult.createMany({
    data: outcome.results.map((r, i) => ({
      evaluationId,
      sequence: i,
      scenarioKey: r.scenario.key,
      category: r.scenario.category,
      severity: r.scenario.severity,
      title: r.scenario.title,
      userTurn: r.scenario.userTurn,
      expected: r.scenario.expected,
      verdict: r.verdict,
      failureKind: r.failure?.kind,
      failureTitle: r.failure?.title,
      failureDetail: r.failure?.detail,
      steps: r.transcript.steps as object,
      context: r.scenario.context as object,
      durationMs: r.durationMs,
    })),
  });

  await patch(evaluationId, {
    status: "COMPLETE",
    stage: "COMPLETE",
    log,
    scenarioCount: outcome.scenarioCount,
    passedCount: outcome.passedCount,
    failedCount: outcome.failedCount,
    score: outcome.score,
    previousScore: previous?.score ?? null,
    scoreDelta: regression ? regression.scoreDelta : null,
    regressions: regression
      ? {
          newFailures: regression.newFailures.map((r) => r.scenario.key),
          fixed: regression.fixed.map((r) => r.scenario.key),
          newCount: regression.newFailures.length,
          fixedCount: regression.fixed.length,
          categories: regression.categoriesAffected,
        }
      : null,
    failuresByCategory: outcome.failuresByCategory as object,
    meta: {
      mode: outcome.mode,
      band: outcome.band,
      durationMs: outcome.durationMs,
      tallies: outcome.tallies,
    },
    finishedAt: new Date(),
    durationMs: outcome.durationMs,
  });
}

export async function createAgent(opts: {
  slug: string;
  name: string;
  description?: string;
  systemPrompt: string;
  tools: ToolDef[];
}): Promise<string> {
  const agent = await prisma.agent.create({
    data: {
      slug: opts.slug,
      name: opts.name,
      description: opts.description,
      systemPrompt: opts.systemPrompt,
      tools: {
        create: opts.tools.map((t, i) => ({
          name: t.name,
          description: t.description,
          params: t.params,
          destructive: t.destructive ?? false,
          requiresApproval: t.requiresApproval ?? false,
          position: i,
        })),
      },
    },
  });
  return agent.id;
}
