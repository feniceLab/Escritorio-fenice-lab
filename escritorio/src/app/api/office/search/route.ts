import { NextRequest, NextResponse } from "next/server";
import { searchOffice } from "@/lib/office/office-service";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") || "";
    return NextResponse.json(await searchOffice(q));
  } catch (error) {
    console.error("Failed to search office:", error);
    return NextResponse.json({ error: "failed_to_search_office" }, { status: 500 });
  }
}
