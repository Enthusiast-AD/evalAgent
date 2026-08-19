import { NextResponse } from "next/server";
import { listAgents, createAgent } from "@/lib/store";
import type { ToolDef } from "@/engine/types";

export async function GET() {
  const agents = await listAgents();
  return NextResponse.json({ agents });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, description, systemPrompt, tools } = body as {
    name: string;
    description?: string;
    systemPrompt: string;
    tools: ToolDef[];
  };

  if (!name || !systemPrompt || !Array.isArray(tools)) {
    return NextResponse.json({ error: "name, systemPrompt and tools are required" }, { status: 400 });
  }

  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || `agent-${Date.now()}`;

  const agentId = await createAgent({ slug, name, description, systemPrompt, tools });
  return NextResponse.json({ agentId, slug }, { status: 201 });
}
