import { NextRequest, NextResponse } from "next/server";
import { buildOfficeContext } from "@/lib/office/office-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const context = await buildOfficeContext({
      clientId: body.clientId,
      channelId: body.channelId,
      npcId: body.npcId,
      contextKind: body.contextKind || "agent-task",
      query: body.query,
      persistSnapshot: body.persistSnapshot !== false,
    });
    if (!context) return NextResponse.json({ error: "context_target_not_found" }, { status: 404 });
    return NextResponse.json({ context });
  } catch (error) {
    console.error("Failed to build office context:", error);
    return NextResponse.json({ error: "failed_to_build_office_context" }, { status: 500 });
  }
}
