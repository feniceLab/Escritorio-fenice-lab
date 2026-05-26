import { db, channels } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getUserId } from "@/lib/internal-rpc";
import { getClientLibrarySeed, type ClientBusinessType } from "@/lib/client-library-defaults";
import { seedChannelLibrary } from "@/lib/library-seeding";

// POST /api/channels/:id/library/seed — seed a channel library with a starter base
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
    const [channel] = await db
      .select({
        id: channels.id,
        name: channels.name,
        ownerId: channels.ownerId,
        clientName: channels.clientName,
        channelType: channels.channelType,
      })
      .from(channels)
      .where(eq(channels.id, id))
      .limit(1);

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (channel.ownerId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (channel.channelType !== "client") {
      return NextResponse.json({ error: "Client base can only be applied to client channels" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const kind = body.kind === "client-base" ? "client-base" : null;

    if (kind !== "client-base") {
      return NextResponse.json({ error: "Unsupported seed kind" }, { status: 400 });
    }

    const businessType =
      body.businessType === "restaurant" ||
      body.businessType === "pizzaria" ||
      body.businessType === "cafe" ||
      body.businessType === "generic"
        ? (body.businessType as ClientBusinessType)
        : "generic";

    const selectedSquads = Array.isArray(body.selectedSquads)
      ? body.selectedSquads.filter((value: unknown): value is string => typeof value === "string")
      : [];

    const seed = getClientLibrarySeed({
      clientName: typeof body.clientName === "string" && body.clientName.trim() ? body.clientName.trim() : channel.clientName || channel.name,
      businessType,
      squads: selectedSquads,
    });

    const result = await seedChannelLibrary(channel.id, seed);

    return NextResponse.json({
      success: true,
      kind,
      attempted: result.attempted,
      created: result.created,
      channelType: channel.channelType,
    });
  } catch (error) {
    console.error("Failed to seed channel library:", error);
    return NextResponse.json({ error: "Failed to seed channel library" }, { status: 500 });
  }
}
