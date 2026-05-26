import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { channels, db } from "@/db";
import { bootstrapClientLibrariesForHq } from "@/lib/client-library-bootstrap";
import { getUserId } from "@/lib/internal-rpc";

// POST /api/channels/:id/library/bootstrap-clients
// Cria os canais de cliente ausentes sob um HQ e semeia suas bibliotecas.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const [hqChannel] = await db
      .select({
        id: channels.id,
        ownerId: channels.ownerId,
        groupId: channels.groupId,
        channelType: channels.channelType,
        mapData: channels.mapData,
        mapConfig: channels.mapConfig,
      })
      .from(channels)
      .where(eq(channels.id, id))
      .limit(1);

    if (!hqChannel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (hqChannel.ownerId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (hqChannel.channelType !== "hq") {
      return NextResponse.json(
        { error: "Client library bootstrap can only run from an HQ channel" },
        { status: 400 },
      );
    }

    const result = await bootstrapClientLibrariesForHq(hqChannel);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Failed to bootstrap client libraries:", error);
    return NextResponse.json({ error: "Failed to bootstrap client libraries" }, { status: 500 });
  }
}
