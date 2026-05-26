import { NextRequest, NextResponse } from "next/server";
import { processPendingNpcAutomations } from "@/lib/npc-automation";

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ errorCode: "unauthorized", error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const processed = await processPendingNpcAutomations(body?.limit ?? 5);
    return NextResponse.json({ processed });
  } catch (error) {
    console.error("[npc-automation] process failed:", error);
    return NextResponse.json(
      { errorCode: "failed_to_process_automation", error: String(error) },
      { status: 500 },
    );
  }
}
