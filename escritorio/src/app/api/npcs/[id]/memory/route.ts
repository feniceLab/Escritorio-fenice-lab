import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db, npcMemoryItems, chatMessages, meetingMinutes, tasks, isPostgres, jsonForDb } from "@/db";
import { parseDbArray, parseDbJson } from "@/lib/db-json";
import { verifyNpcOwnership } from "@/lib/npc-route-access";

const VALID_MEMORY_TYPES = ["fact", "episodic", "summary", "relationship", "working"];

type MeetingParticipant = {
  id?: string;
  name?: string;
  type?: "npc" | "player";
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await verifyNpcOwnership(req, id);
  if (!access.ok) {
    return NextResponse.json({ errorCode: access.errorCode, error: access.error }, { status: access.status });
  }

  try {
    const [manualMemories, recentChats, npcTasks, channelMeetings] = await Promise.all([
      db.select().from(npcMemoryItems)
        .where(eq(npcMemoryItems.npcId, id))
        .orderBy(desc(npcMemoryItems.pinned), npcMemoryItems.sortOrder, desc(npcMemoryItems.createdAt))
        .limit(80),
      db.select().from(chatMessages)
        .where(eq(chatMessages.npcId, id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(20),
      db.select().from(tasks)
        .where(eq(tasks.npcId, id))
        .orderBy(desc(tasks.updatedAt))
        .limit(12),
      db.select().from(meetingMinutes)
        .where(eq(meetingMinutes.channelId, access.channel.id))
        .orderBy(desc(meetingMinutes.createdAt))
        .limit(20),
    ]);

    const meetings = channelMeetings
      .filter((minute) => {
        const participants = parseDbArray<MeetingParticipant>(minute.participants);
        return participants.some((participant) => participant.type === "npc" && participant.id === id)
          || minute.transcript.includes(access.npc.name);
      })
      .slice(0, 8)
      .map((minute) => ({
        id: minute.id,
        topic: minute.topic,
        transcript: minute.transcript,
        participants: parseDbArray<MeetingParticipant>(minute.participants),
        keyTopics: parseDbArray<string>(minute.keyTopics),
        conclusions: minute.conclusions,
        createdAt: minute.createdAt,
      }));

    return NextResponse.json({
      manualMemories: manualMemories.map((memory) => ({
        ...memory,
        metadata: parseDbJson(memory.metadata) ?? memory.metadata,
      })),
      recentChats,
      tasks: npcTasks,
      meetings,
      memoryLayers: {
        firstLayer: manualMemories.filter((memory) => memory.memoryType === "working" || memory.memoryType === "episodic").length,
        secondLayer: manualMemories.filter((memory) => memory.memoryType === "summary" || memory.memoryType === "relationship").length,
        longTerm: manualMemories.filter((memory) => memory.memoryType === "fact").length,
      },
    });
  } catch (error) {
    console.error("Failed to load NPC memory:", error);
    return NextResponse.json({ errorCode: "failed_to_load_npc_memory", error: "Failed to load NPC memory" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await verifyNpcOwnership(req, id);
  if (!access.ok) {
    return NextResponse.json({ errorCode: access.errorCode, error: access.error }, { status: access.status });
  }

  try {
    const body = await req.json();
    const memoryType = typeof body.memoryType === "string" ? body.memoryType.trim() : "fact";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!VALID_MEMORY_TYPES.includes(memoryType) || !title || !content) {
      return NextResponse.json({ errorCode: "invalid_memory_item", error: "Invalid memory item" }, { status: 400 });
    }

    const now = isPostgres ? new Date() : new Date().toISOString();
    const [memory] = await db.insert(npcMemoryItems).values({
      npcId: id,
      memoryType,
      title,
      content,
      metadata: body.metadata ? jsonForDb(body.metadata) : null,
      pinned: Boolean(body.pinned),
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      createdAt: now as unknown as Date,
      updatedAt: now as unknown as Date,
    }).returning();

    return NextResponse.json({
      memory: {
        ...memory,
        metadata: parseDbJson(memory.metadata) ?? memory.metadata,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create NPC memory item:", error);
    return NextResponse.json({ errorCode: "failed_to_create_npc_memory_item", error: "Failed to create NPC memory item" }, { status: 500 });
  }
}
