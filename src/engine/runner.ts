import { runAgent } from "./agent";
import { analyze } from "./analyzer";
import { generateScenarios } from "./scenarios";
import { generateLlmScenarios } from "./llm-scenarios";
import { runLlmAgent, isLlmModeAvailable } from "./llm-agent";
import { scoreSuite } from "./scoring";
import { detectDomain, DOMAIN_INFO } from "./domain";
import type { EvaluationOutcome, Scenario, ScenarioResult, ToolDef } from "./types";

const STEP_MS = 45;
const TOOL_MS = 22;
const LLM_BUDGET = 14;
const LLM_CONCURRENCY = 3;

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

function sampleForLlm(scenarios: Scenario[], budget: number): Scenario[] {
  const byCat = new Map<string, Scenario[]>();
  for (const s of scenarios) {
    const list = byCat.get(s.category) ?? [];
    list.push(s);
    byCat.set(s.category, list);
  }
  const picked: Scenario[] = [];
  const entries = [...byCat.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [, list] of entries) {
    if (picked.length >= budget) break;
    picked.push(list[0]);
  }
  for (const [, list] of entries) {
    for (let i = 1; i < list.length && picked.length < budget; i++) picked.push(list[i]);
  }
  return picked;
}

export async function runEvaluation(
  prompt: string,
  tools: ToolDef[],
  opts?: { mode?: "simulator" | "llm"; includeLlmScenarios?: boolean; log?: (m: string) => void }
): Promise<EvaluationOutcome> {
  const log = opts?.log ?? (() => {});
  const mode = opts?.mode === "llm" && isLlmModeAvailable() ? "llm" : "simulator";

  log("generating adversarial scenarios from tool schema");
  const deterministic = generateScenarios(tools);
  const domain = detectDomain(prompt);
  log(`built ${deterministic.length} deterministic scenarios across ${new Set(deterministic.map((s) => s.category)).size} categories`);
  log(`task domain: ${DOMAIN_INFO[domain].label}`);

  let scenarios: Scenario[] = deterministic;
  let llmScenarios: Scenario[] = [];

  if (mode === "llm") {
    log("requesting generated scenarios from Gemini");
    llmScenarios = await generateLlmScenarios(prompt, tools, { max: 8 }).catch(() => []);
    log(llmScenarios.length > 0 ? `Gemini added ${llmScenarios.length} adversarial scenarios` : "Gemini returned no scenarios, using deterministic suite");
    const sampled = sampleForLlm(deterministic, LLM_BUDGET - llmScenarios.length);
    scenarios = [...sampled, ...llmScenarios];
    log(`executing ${scenarios.length} scenarios against the live model`);
  } else {
    log("spinning up sandbox");
    log("executing agent against scenario suite");
  }

  const results: ScenarioResult[] = [];
  const started = Date.now();

  const runOne = async (scenario: Scenario): Promise<ScenarioResult> => {
    const transcript =
      mode === "llm" ? await runLlmAgent(prompt, tools, scenario) : runAgent(prompt, tools, scenario);
    const verdict = analyze(scenario, transcript);
    const steps = transcript.steps.length;
    const durationMs = mode === "llm" ? 0 : steps * STEP_MS + steps * TOOL_MS;

    return {
      scenario,
      verdict: verdict.verdict,
      failure:
        verdict.verdict === "FAIL"
          ? {
              kind: verdict.kind ?? "destructive-action",
              severity: scenario.severity,
              title: verdict.title ?? "Failure",
              detail: verdict.detail ?? "",
            }
          : undefined,
      transcript,
      durationMs,
    };
  };

  if (mode === "llm") {
    results.push(...(await mapLimit(scenarios, LLM_CONCURRENCY, runOne)));
  } else {
    for (const s of scenarios) results.push(await runOne(s));
  }

  const { score, band, tallies, failuresByCategory, passedCount, failedCount, scenarioCount } = scoreSuite(results);
  const durationMs = mode === "llm" ? Date.now() - started : Date.now() - started + results.reduce((a, r) => a + r.durationMs, 0);

  log("classifying failures");
  log("computing reliability score");

  return {
    mode,
    score,
    band,
    tallies,
    failuresByCategory,
    passedCount,
    failedCount,
    scenarioCount,
    durationMs,
    results,
    log: [],
  };
}
