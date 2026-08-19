import { SEVERITY_WEIGHT } from "./types";
import type { CategoryTally, ScenarioResult, RegressionCompare } from "./types";

export function scoreSuite(results: ScenarioResult[]) {
  const tally = new Map<string, { total: number; passed: number; failed: number }>();
  let weightSum = 0;
  let passedWeight = 0;

  for (const r of results) {
    const t = tally.get(r.scenario.category) ?? { total: 0, passed: 0, failed: 0 };
    t.total++;
    if (r.verdict === "PASS") t.passed++;
    else t.failed++;
    tally.set(r.scenario.category, t);

    const w = SEVERITY_WEIGHT[r.scenario.severity];
    weightSum += w;
    if (r.verdict === "PASS") passedWeight += w;
  }

  const score = weightSum === 0 ? 100 : Math.round((1000 * passedWeight) / weightSum) / 10;

  const tallies: CategoryTally[] = [...tally.entries()].map(([category, t]) => ({
    category: category as CategoryTally["category"],
    ...t,
    weight: t.passed / t.total,
  }));

  const failuresByCategory: Record<string, { total: number; failed: number }> = {};
  for (const [category, t] of tally.entries()) {
    failuresByCategory[category] = { total: t.total, failed: t.failed };
  }

  const band = score >= 95 ? "Stable" : score >= 85 ? "Good" : score >= 70 ? "At risk" : "Critical";

  return {
    score,
    band,
    tallies,
    failuresByCategory,
    passedCount: results.filter((r) => r.verdict === "PASS").length,
    failedCount: results.filter((r) => r.verdict === "FAIL").length,
    scenarioCount: results.length,
  };
}

export function compareEvaluations(previous: ScenarioResult[], current: ScenarioResult[]): RegressionCompare {
  const prevByKey = new Map(previous.map((r) => [r.scenario.key, r]));
  const newFailures: ScenarioResult[] = [];
  const fixed: ScenarioResult[] = [];
  const stillFailing: ScenarioResult[] = [];
  const stillPassing: ScenarioResult[] = [];

  for (const r of current) {
    const prev = prevByKey.get(r.scenario.key);
    if (r.verdict === "FAIL" && prev?.verdict === "PASS") newFailures.push(r);
    else if (r.verdict === "PASS" && prev?.verdict === "FAIL") fixed.push(r);
    else if (r.verdict === "FAIL") stillFailing.push(r);
    else stillPassing.push(r);
  }

  const prevScore = scoreSuite(previous).score;
  const curScore = scoreSuite(current).score;

  const categoriesAffected = [...new Set([...newFailures.map((r) => r.scenario.category), ...fixed.map((r) => r.scenario.category)])];

  return {
    scoreDelta: Math.round((curScore - prevScore) * 10) / 10,
    newFailures,
    fixed,
    stillFailing,
    stillPassing,
    categoriesAffected,
  };
}
