import { NextRequest, NextResponse } from "next/server";
import { buildOfficeContext } from "@/lib/office/office-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const context = await buildOfficeContext({
      clientId: id,
      npcId: req.nextUrl.searchParams.get("npcId"),
      contextKind: req.nextUrl.searchParams.get("kind") || "client-workspace",
      query: req.nextUrl.searchParams.get("q"),
    });
    if (!context) return NextResponse.json({ error: "client_not_found" }, { status: 404 });
    return NextResponse.json({ context });
  } catch (error) {
    console.error("Failed to build office context:", error);
    return NextResponse.json({ error: "failed_to_build_office_context" }, { status: 500 });
  }
}
