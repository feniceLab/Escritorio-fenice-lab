import { NextRequest, NextResponse } from "next/server";
import { listApprovalRequests } from "@/lib/npc-automation";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ errorCode: "unauthorized", error: "Unauthorized" }, { status: 401 });
  }

  const rawLimit = Number(req.nextUrl.searchParams.get("limit"));
  const approvals = await listApprovalRequests({
    channelId: req.nextUrl.searchParams.get("channelId"),
    npcId: req.nextUrl.searchParams.get("npcId"),
    status: req.nextUrl.searchParams.get("status") ?? "pending",
    limit: Number.isFinite(rawLimit) ? rawLimit : 50,
  });

  return NextResponse.json({ approvals });
}
