export async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `request failed: ${res.status}`);
  }
  return res.json();
}

export type ToolRow = {
  name: string;
  description: string;
  destructive: boolean;
  params: Record<string, { type: string; description?: string }>;
};

export type RunResultDto = {
  id: string;
  sequence: number;
  scenarioKey: string;
  category: string;
  severity: string;
  title: string;
  userTurn: string;
  expected: string;
  verdict: "PASS" | "FAIL";
  failureKind: string | null;
  failureTitle: string | null;
  failureDetail: string | null;
  steps: {
    kind: string;
    tool?: string;
    args?: Record<string, unknown>;
    text?: string;
    ok?: boolean;
    data?: unknown;
    seq?: number;
  }[];
  context?: Record<string, unknown>;
  durationMs: number;
};

export type EvaluationDto = {
  id: string;
  status: string;
  stage: string;
  log: string[];
  score: number | null;
  previousScore: number | null;
  scoreDelta: number | null;
  scenarioCount: number;
  passedCount: number;
  failedCount: number;
  mode: string;
  createdAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  regressions: {
    newFailures: string[];
    fixed: string[];
    newCount: number;
    fixedCount: number;
    categories: string[];
  } | null;
  failuresByCategory: Record<string, { total: number; failed: number }> | null;
  meta: {
    band: string;
    tallies: { category: string; total: number; passed: number; failed: number; weight: number }[];
  } | null;
  vsEvaluationId: string | null;
  agent: AgentDto;
  agentVersion: { id: string; number: number; label: string | null; prompt: string } | null;
  runResults: RunResultDto[];
};

export type AgentDto = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  createdAt: string;
  tools: ToolRow[];
  versions: { id: string; number: number; label: string | null; prompt: string; evaluation: { id: string; score: number | null } | null }[];
  evaluations: EvaluationDto[];
};

export function fmtScore(score: number | null): string {
  if (score === null || Number.isNaN(score)) return "-";
  return score % 1 === 0 ? String(score) : score.toFixed(1);
}

export function fmtDelta(d: number | null): string {
  if (d === null || Number.isNaN(d)) return "";
  return `${d >= 0 ? "+" : ""}${fmtScore(Math.abs(d) >= 10 ? d : Math.round(d * 10) / 10)}`;
}

export function fmtMs(ms: number | null | undefined): string {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
