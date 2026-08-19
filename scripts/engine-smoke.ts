import { REFERENCE_AGENTS } from "../src/engine/agents";
import { runEvaluation } from "../src/engine/runner";

function pad(s: string, n: number) {
  return s.padEnd(n);
}

async function main() {
  for (const agent of REFERENCE_AGENTS) {
    console.log(`\n=== ${agent.name} ===`);
    for (const v of agent.versions) {
      const out = await runEvaluation(v.prompt, agent.tools, { mode: "simulator" });
      console.log(
        `${pad(v.label, 6)} score=${String(out.score).padStart(5)} band=${pad(out.band, 8)} pass=${out.passedCount}/${out.scenarioCount}`
      );
      const failures = out.results.filter((r) => r.verdict === "FAIL");
      for (const f of failures) {
        console.log(`   [${f.failure?.kind ?? "?"}] ${f.scenario.key} - ${f.scenario.title}`);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
