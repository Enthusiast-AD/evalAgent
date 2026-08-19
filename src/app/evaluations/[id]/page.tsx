import { notFound } from "next/navigation";
import { getEvaluation } from "@/lib/store";
import { serializeEvaluation } from "@/lib/serialize";
import { EvaluationExplorer } from "@/components/evaluation-explorer";

export const dynamic = "force-dynamic";

export default async function EvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const evaluation = await getEvaluation(id);
  if (!evaluation) notFound();
  return <EvaluationExplorer initial={serializeEvaluation(evaluation)} />;
}
