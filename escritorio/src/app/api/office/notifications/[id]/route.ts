import { NextRequest, NextResponse } from "next/server";
import { updateOfficeNotification } from "@/lib/office/office-service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const status = body?.status;
    if (!["unread", "read", "resolved"].includes(status)) {
      return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    }
    const notification = await updateOfficeNotification(id, status);
    if (!notification) return NextResponse.json({ error: "notification_not_found" }, { status: 404 });
    return NextResponse.json({ notification });
  } catch (error) {
    console.error("Failed to update office notification:", error);
    return NextResponse.json({ error: "failed_to_update_office_notification" }, { status: 500 });
  }
}
