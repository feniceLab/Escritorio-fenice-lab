import { NextResponse } from "next/server";
import { getOfficeOverview } from "@/lib/office/office-service";

export async function GET() {
  try {
    return NextResponse.json(await getOfficeOverview());
  } catch (error) {
    console.error("Failed to load office overview:", error);
    return NextResponse.json({ error: "failed_to_load_office_overview" }, { status: 500 });
  }
}
