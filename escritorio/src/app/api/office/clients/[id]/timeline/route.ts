import { NextResponse } from "next/server";
import { getOfficeTimeline } from "@/lib/office/office-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const timeline = await getOfficeTimeline(id);
    if (!timeline) return NextResponse.json({ error: "client_not_found" }, { status: 404 });
    return NextResponse.json(timeline);
  } catch (error) {
    console.error("Failed to load office timeline:", error);
    return NextResponse.json({ error: "failed_to_load_office_timeline" }, { status: 500 });
  }
}
