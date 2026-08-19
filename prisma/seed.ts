import { PrismaClient } from "@prisma/client";
import { REFERENCE_AGENTS } from "../src/engine/agents";
import { createAgent, createEvaluationForAgent, processEvaluation } from "../src/lib/store";

const prisma = new PrismaClient();

async function main() {
  await prisma.appState.deleteMany({});
  await prisma.runResult.deleteMany({});
  await prisma.evaluation.deleteMany({});
  await prisma.agentVersion.deleteMany({});
  await prisma.agentTool.deleteMany({});
  await prisma.agent.deleteMany({});

  for (const def of REFERENCE_AGENTS) {
    const agentId = await createAgent({
      slug: def.slug,
      name: def.name,
      description: def.description,
      systemPrompt: def.versions[def.versions.length - 1].prompt,
      tools: def.tools,
    });

    for (const v of def.versions) {
      const { evaluation } = await createEvaluationForAgent({
        agentId,
        prompt: v.prompt,
        versionLabel: v.label,
      });
      await processEvaluation(evaluation.id);
      const done = await prisma.evaluation.findUnique({ where: { id: evaluation.id } });
      console.log(`  ${def.slug} ${v.label} -> score ${done?.score}, ${done?.passedCount}/${done?.scenarioCount} passed`);
    }
  }

  await prisma.appState.upsert({
    where: { id: 1 },
    update: { seeded: true },
    create: { id: 1, seeded: true },
  });

  console.log("seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
