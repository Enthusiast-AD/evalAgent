import { NextResponse } from "next/server";
import { getEvaluation } from "@/lib/store";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const evaluation = await getEvaluation(id);
  if (!evaluation) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ evaluation });
}
