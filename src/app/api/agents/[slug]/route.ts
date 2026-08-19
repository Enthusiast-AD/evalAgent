import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createEvaluationForAgent, processEvaluation } from "@/lib/store";

export const maxDuration = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = await prisma.agent.findUnique({
    where: { slug },
    include: {
      tools: { orderBy: { position: "asc" } },
      versions: { orderBy: { number: "asc" }, include: { evaluation: true } },
      evaluations: { orderBy: { createdAt: "desc" }, take: 6 },
    },
  });
  if (!agent) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ agent });
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = await prisma.agent.findUnique({ where: { slug } });
  if (!agent) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const prompt = typeof body.prompt === "string" ? body.prompt : undefined;
  const mode: "simulator" | "llm" = body.mode === "llm" ? "llm" : "simulator";

  const { evaluation } = await createEvaluationForAgent({ agentId: agent.id, prompt, mode });
  await processEvaluation(evaluation.id);

  return NextResponse.json({ evaluationId: evaluation.id, versionId: evaluation.agentVersionId });
}
