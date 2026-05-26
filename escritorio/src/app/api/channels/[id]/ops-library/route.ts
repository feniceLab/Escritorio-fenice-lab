import { db, channelLibraryItems, channels } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getUserId } from "@/lib/internal-rpc";
import { parseDbJson } from "@/lib/db-json";
import { getChannelMcpServers, getChannelSkills } from "@/lib/agency-resources";

// GET /api/channels/:id/ops-library — operational resources for the channel
export async function GET(
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
        clientName: channels.clientName,
        channelType: channels.channelType,
        parentChannelId: channels.parentChannelId,
      })
      .from(channels)
      .where(eq(channels.id, id))
      .limit(1);

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const apiRows = await db
      .select()
      .from(channelLibraryItems)
      .where(and(eq(channelLibraryItems.channelId, id), eq(channelLibraryItems.layer, "api")))
      .orderBy(channelLibraryItems.sortOrder, channelLibraryItems.createdAt);

    const [mcpServers, skills] = await Promise.all([
      getChannelMcpServers(id),
      getChannelSkills(id),
    ]);

    const apiItems = apiRows.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      metadata: parseDbJson(item.metadata) ?? item.metadata,
      hasValue: Boolean(item.content),
      updatedAt: item.updatedAt,
      createdAt: item.createdAt,
    }));

    // If it's an HQ, also fetch all client configs from children channels
    let allClientConfigs: any[] = [];
    if (channel.channelType === "hq") {
      const allClientsConfigsRows = await db
        .select({
          id: channelLibraryItems.id,
          channelId: channelLibraryItems.channelId,
          channelName: channels.name,
          content: channelLibraryItems.content,
          updatedAt: channelLibraryItems.updatedAt,
        })
        .from(channelLibraryItems)
        .innerJoin(channels, eq(channels.id, channelLibraryItems.channelId))
        .where(and(eq(channelLibraryItems.category, "client-config"), eq(channels.parentChannelId, id)));

      allClientConfigs = allClientsConfigsRows.map((row) => ({
        id: row.id,
        channelId: row.channelId,
        channelName: row.channelName,
        config: parseDbJson(row.content),
        updatedAt: row.updatedAt,
      }));
    }

    return NextResponse.json({
      channel: {
        id: channel.id,
        name: channel.clientName?.trim() || channel.name,
        channelType: channel.channelType,
        parentChannelId: channel.parentChannelId,
      },
      apiItems,
      allClientConfigs,
      mcpServers,
      skills,
    });
  } catch (error) {
    console.error("Failed to fetch ops library:", error);
    return NextResponse.json({ error: "Failed to fetch ops library" }, { status: 500 });
  }
}
