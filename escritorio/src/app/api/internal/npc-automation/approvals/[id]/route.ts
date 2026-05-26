import { NextRequest, NextResponse } from "next/server";
import { reviewNpcAutomationApproval } from "@/lib/npc-automation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ errorCode: "unauthorized", error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const decision = body?.decision === "reject" ? "reject" : "approve";
    const approval = await reviewNpcAutomationApproval({
      approvalId: id,
      reviewerUserId: userId,
      decision,
      reason: typeof body?.reason === "string" ? body.reason : null,
    });
    return NextResponse.json({ approval });
  } catch (error) {
    console.error("[npc-automation] approval review failed:", error);
    return NextResponse.json(
      { errorCode: "failed_to_review_approval", error: String(error) },
      { status: 400 },
    );
  }
}
