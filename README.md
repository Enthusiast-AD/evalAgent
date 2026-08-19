# AgentGuard

**The CI/CD pipeline for AI agents.**

Autonomous agents fail most real-world tasks - industry benchmarks put the failure rate near 70%. Teams usually ship against a handful of handwritten test prompts, so the real failure modes only surface after deployment, on live data.

AgentGuard treats an agent like a codebase. Every prompt edit is a version, every version gets an adversarial scan, every failure is classified with evidence, and regressions block the promotion of a worse agent.

## What it does

- **Generates adversarial scenarios** from an agent's tools, prompt, and task domain - prompt injection, indirect (tool-data) injection, unauthorized access, destructive-action pressure, hallucination, fabricated success, goal drift, tool-call loops, over-refusal, and guardrails under pressure (VIP insistence, threats, bribes, fake approvals).
- **Runs the agent in a sandbox** with mocked tools, seeded records, an identical-call loop guard, and full transcript capture for deterministic replay.
- **Classifies every failure** into 11 typed categories with a severity, a human-readable evidence string, and a suggested prompt fix.
- **Scores reliability** with a severity-weighted score, a per-category breakdown, a reliability-by-version chart, and a printable report per scan.
- **Tracks regressions** - each run is compared against the previous one, surfacing new failures, fixed failures, and the score delta.
- **Replays any run** step by step from its captured transcript.

## Two execution modes

- **Simulator** - a deterministic, policy-driven agent runtime. The same prompt always yields the same score. No API key needed.
- **Gemini** - runs your agent live against the Gemini model inside the sandbox, with real function calling. Key-gated via `GEMINI_API_KEY`.

## The demo arc

The seeded reference agents tell the story. As the system prompt gains guardrails, the adversarial score climbs:

```
Support Agent    10.2 → 87.5 → 98.4 → 100    (39 scenarios)
Finance Copilot   23.9 → 84.7                 (26 scenarios)
```

Edit a prompt, run a scan, and watch the score move - with the exact failing scenario, transcript, and a suggested fix.

## How it works

```
system prompt + tool registry
        │
        ▼
┌───────────────────────────────┐
│ Scenario generator            │  deterministic templates + tool-adaptive
│ (domain detection, variants)  │  cases, optionally augmented by Gemini
└──────────────┬────────────────┘
               ▼
┌───────────────────────────────┐
│ Sandbox executor              │  simulated agent or live Gemini, with
│ (mock tools, seeded records,  │  loop guard and full transcript capture
│  loop guard)                  │
└──────────────┬────────────────┘
               ▼
┌───────────────────────────────┐
│ Failure analyzer              │  assertion verdicts, 11 failure kinds,
│                               │  severity, evidence, suggested fix
└──────────────┬────────────────┘
               ▼
┌───────────────────────────────┐
│ Reliability score + regression│  severity-weighted score, per-category
│                               │  breakdown, delta vs previous version
└───────────────────────────────┘
```

The engine in `src/engine/` is a pure TypeScript domain layer with zero framework dependencies.

The simulator is a policy-driven runtime. `parsePolicy()` reads behavior rules out of the prompt text (identity gates, refund limits, injection guards, grounding rules, escalation rules), and the agent behaves accordingly. The prompt is not decorative - it is the decision layer.

## Tech stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS with a hand-built design system
- WebGL shaders for the hero field
- Prisma + PostgreSQL (Neon)
- Gemini via the OpenAI-compatible endpoint

## Getting started

```bash
pnpm install

# configure the database
cp .env.example .env
# set DATABASE_URL to a Postgres URL (Neon, Supabase, ...)

# push the schema and seed the reference agents
pnpm setup

# run the deterministic engine smoke test
pnpm test

# start the dev server
pnpm dev
```

Open `http://localhost:3000`.

## Enabling the Gemini mode

Add your key to `.env`:

```
GEMINI_API_KEY="..."
GEMINI_MODEL="gemini-2.0-flash"
```

With the key set, the agent page gains a `Gemini` mode toggle.

Runs against the live model use the same scenario suite and sandbox, with a bounded scenario budget and concurrency so a scan stays well under serverless limits.

Without a key, AgentGuard runs fully deterministically in the simulator.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string. |
| `GEMINI_API_KEY` | no | Enables LLM scenario generation and live-agent mode. |
| `GEMINI_MODEL` | no | Defaults to `gemini-2.0-flash`. |
| `GEMINI_BASE_URL` | no | Defaults to the Gemini OpenAI-compatible endpoint. |

## Scripts

- `pnpm dev` - dev server
- `pnpm build` / `pnpm start` - production build and start
- `pnpm setup` - push schema + seed reference agents
- `pnpm db:reset` - wipe and re-seed
- `pnpm test` - deterministic engine smoke test
- `pnpm llm:mock` - run the LLM pipeline against a local mock server (no key needed)

## Deploying

This project is built for serverless hosts such as Vercel.

1. Push the repo to GitHub.
2. Import into Vercel.
3. Add `DATABASE_URL` (Neon) and optionally `GEMINI_API_KEY` to the project environment variables.
4. Run `pnpm db:push` and `pnpm db:seed` once against the production database (or use Prisma migrations).

Scans run synchronously inside the request, so no queue or background worker is required.

## Project structure

```
prisma/            schema + seed
src/engine/        domain layer (zero framework deps)
  agent.ts         deterministic simulator runtime
  analyzer.ts      failure classification + evidence
  scenarios.ts     deterministic scenario catalog + variants
  llm-agent.ts     live Gemini agent runtime
  llm-scenarios.ts Gemini scenario generation
  gemini.ts        OpenAI-compatible chat client
  policy.ts        prompt -> behavior rules parser
  domain.ts        task-domain detection
  scoring.ts       severity-weighted scoring + regressions
  actionable.ts    suggested prompt fixes per failure kind
src/lib/           prisma client + store + serializers
src/app/           pages + API routes
src/components/    UI (design system, shader, explorer, report)
```