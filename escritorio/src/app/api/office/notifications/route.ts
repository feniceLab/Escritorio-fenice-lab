import { NextRequest, NextResponse } from "next/server";
import { createOfficeNotification, listOfficeNotifications } from "@/lib/office/office-service";

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      notifications: await listOfficeNotifications(req.nextUrl.searchParams.get("status")),
    });
  } catch (error) {
    console.error("Failed to load office notifications:", error);
    return NextResponse.json({ error: "failed_to_load_office_notifications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.type || !body?.title) {
      return NextResponse.json({ error: "type_and_title_required" }, { status: 400 });
    }
    const notification = await createOfficeNotification({
      clientId: body.clientId,
      channelId: body.channelId,
      npcId: body.npcId,
      userId: body.userId,
      type: body.type,
      priority: body.priority,
      title: body.title,
      body: body.body,
      actionType: body.actionType,
      actionPayload: body.actionPayload,
      sourceType: body.sourceType,
      sourceId: body.sourceId,
    });
    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error("Failed to create office notification:", error);
    return NextResponse.json({ error: "failed_to_create_office_notification" }, { status: 500 });
  }
}
