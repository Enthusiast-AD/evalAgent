export type ParamKind = "string" | "number" | "integer" | "boolean";

export type ToolParam = {
  type: ParamKind;
  description?: string;
};

export type ToolDef = {
  name: string;
  description: string;
  params: Record<string, ToolParam>;
  destructive?: boolean;
  requiresApproval?: boolean;
};

export type Severity = "critical" | "high" | "medium" | "low";

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 1,
  high: 0.7,
  medium: 0.4,
  low: 0.2,
};

export const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low"];

export type Category =
  | "prompt-injection"
  | "data-injection"
  | "unauthorized-access"
  | "destructive-action"
  | "tool-misuse"
  | "hallucination"
  | "fabricated-success"
  | "goal-drift"
  | "tool-loop"
  | "refusal-issue"
  | "efficiency";

export const CATEGORY_LABEL: Record<Category, string> = {
  "prompt-injection": "Prompt injection",
  "data-injection": "Indirect injection",
  "unauthorized-access": "Unauthorized access",
  "destructive-action": "Destructive action",
  "tool-misuse": "Tool misuse",
  hallucination: "Hallucination",
  "fabricated-success": "Fabricated success",
  "goal-drift": "Goal drift",
  "tool-loop": "Tool-call loop",
  "refusal-issue": "Over-refusal",
  efficiency: "Efficiency",
};

export type OrderData = {
  id: string;
  total: number;
  refunded: boolean;
  status: string;
  email?: string;
};

export type UserData = {
  id: string;
  email: string;
  name: string;
};

export type KbArticle = {
  title: string;
  content: string;
};

export type ScenarioContext = {
  identityVerified?: boolean;
  actingUser?: string;
  actingEmail?: string;
  targetUserId?: string;
  requestedOrderId?: string;
  requestedAmount?: number;
  requestedTool?: string;
  requestReason?: string;
  orders?: Record<string, OrderData>;
  users?: Record<string, UserData>;
  kb?: KbArticle[];
  approval?: boolean;
  note?: string;
};

export type Assertion =
  | { kind: "no-destructive-call"; tools: string[]; mustRefuse?: boolean }
  | { kind: "no-tool-call"; mustRefuse?: boolean }
  | { kind: "no-data-disclosure" }
  | { kind: "no-hallucination" }
  | { kind: "no-fabricated-success" }
  | { kind: "no-loop" }
  | { kind: "validate-params"; tool: string; description: string }
  | { kind: "resolve-or-escalate" }
  | { kind: "complete-request"; tool?: string }
  | { kind: "no-injected-follow"; injectedTool?: string };

export type Scenario = {
  key: string;
  category: Category;
  severity: Severity;
  title: string;
  userTurn: string;
  expected: string;
  context: ScenarioContext;
  assertion: Assertion;
};

export type Policy = {
  verifyIdentity: boolean;
  refundLimit?: number;
  approvalRequired: boolean;
  oneRefundPerOrder: boolean;
  noUnauthorizedAccess: boolean;
  injectionGuard: boolean;
  dataInjectionGuard: boolean;
  grounded: boolean;
  noFalseClaim: boolean;
  escalateOnStuck: boolean;
  validateAmounts: boolean;
};

export type Step =
  | { kind: "user"; text: string }
  | { kind: "assistant"; text: string }
  | { kind: "tool_call"; tool: string; args: Record<string, unknown>; seq: number }
  | { kind: "tool_result"; tool: string; args: Record<string, unknown>; ok: boolean; data: unknown; seq: number }
  | { kind: "sys"; text: string };

export type Transcript = {
  steps: Step[];
  looped: boolean;
  loopDetail?: string;
};

export type FailureKind =
  | "prompt-injection"
  | "indirect-injection"
  | "unauthorized-access"
  | "destructive-action"
  | "tool-misuse"
  | "hallucination"
  | "fabricated-success"
  | "goal-drift"
  | "tool-loop"
  | "refusal-issue";

export const FAILURE_LABEL: Record<FailureKind, string> = {
  "prompt-injection": "Prompt injection",
  "indirect-injection": "Indirect injection",
  "unauthorized-access": "Unauthorized access",
  "destructive-action": "Destructive action",
  "tool-misuse": "Tool misuse",
  hallucination: "Hallucination",
  "fabricated-success": "Fabricated success",
  "goal-drift": "Goal drift",
  "tool-loop": "Tool-call loop",
  "refusal-issue": "Over-refusal",
};

export type Verdict = "PASS" | "FAIL";

export type ScenarioResult = {
  scenario: Scenario;
  verdict: Verdict;
  failure?: { kind: FailureKind; severity: Severity; title: string; detail: string };
  transcript: Transcript;
  durationMs: number;
};

export type CategoryTally = {
  category: Category;
  total: number;
  passed: number;
  failed: number;
  weight: number;
};

export type EvaluationOutcome = {
  mode: "simulator" | "llm";
  score: number;
  passedCount: number;
  failedCount: number;
  scenarioCount: number;
  durationMs: number;
  band: string;
  failuresByCategory: Record<string, { total: number; failed: number }>;
  tallies: CategoryTally[];
  results: ScenarioResult[];
  log: string[];
};

export type RegressionCompare = {
  scoreDelta: number;
  newFailures: ScenarioResult[];
  fixed: ScenarioResult[];
  stillFailing: ScenarioResult[];
  stillPassing: ScenarioResult[];
  categoriesAffected: string[];
};
