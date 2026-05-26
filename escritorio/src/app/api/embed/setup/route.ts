/**
 * Fenix OS Embedded Setup
 *
 * Idempotent endpoint that provisions everything needed for embedded mode:
 *   - System user "fenix-embed-user"
 *   - A default character for that user
 *   - The "Fenix HQ" channel
 *
 * Returns { channelId, characterId } so the root page can redirect directly to the office.
 */

import { NextRequest, NextResponse } from "next/server";
import { db, isPostgres, jsonForDb } from "@/db";
import { users, characters, channels, groups, groupMembers } from "@/db";
import { eq, and } from "drizzle-orm";
import { hashPassword } from "@/lib/password";
import smallOfficeTemplate from "@/lib/builtin/small-office-template.json";
import { OFFICE_PRESETS } from "@/lib/office-presets";
import { seedBuiltinTemplates } from "@/lib/builtin-templates";

const EMBEDDED_USER_ID = "fenix-embed-user";
const EMBEDDED_NICKNAME = "Fenix OS";
const EMBEDDED_LOGIN_ID = "fenix-embed";
const CHANNEL_NAME = "Fenix HQ";

// Aparência padrão derivada do preset dev-a (LPC format válido).
const DEFAULT_PRESET = OFFICE_PRESETS[0];
const DEFAULT_APPEARANCE = {
  bodyType: DEFAULT_PRESET.bodyType,
  layers: DEFAULT_PRESET.layers,
};

function now() {
  return isPostgres ? new Date() : new Date().toISOString();
}

function normalizeEmbeddedCharacterName(value: string | null) {
  const cleaned = (value || EMBEDDED_NICKNAME)
    .replace(/[^\p{L}\p{N}\s._-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || EMBEDDED_NICKNAME).slice(0, 50);
}

function pickAppearanceForName(name: string) {
  if (!OFFICE_PRESETS.length) return DEFAULT_APPEARANCE;
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  const preset = OFFICE_PRESETS[Math.abs(hash) % OFFICE_PRESETS.length] || DEFAULT_PRESET;
  return {
    bodyType: preset.bodyType,
    layers: preset.layers,
  };
}

export async function GET(req: NextRequest) {
  if (process.env.FENIX_EMBEDDED !== "true") {
    return NextResponse.json({ error: "Not in embedded mode" }, { status: 403 });
  }

  try {
    const characterName = normalizeEmbeddedCharacterName(req.nextUrl.searchParams.get("user"));

    // ── 0. Seed built-in map templates (idempotente) ──────────────────────
    await seedBuiltinTemplates();

    // ── 1. Ensure the embed user exists ────────────────────────────────────
    const existingUsers = await db
      .select({ id: users.id, systemRole: users.systemRole })
      .from(users)
      .where(eq(users.id, EMBEDDED_USER_ID))
      .limit(1);

    if (existingUsers.length === 0) {
      const passwordHash = await hashPassword("fenix-embed-no-login");
      await db.insert(users).values({
        id: EMBEDDED_USER_ID,
        loginId: EMBEDDED_LOGIN_ID,
        nickname: EMBEDDED_NICKNAME,
        passwordHash,
        systemRole: "system_admin",
        createdAt: now() as unknown as Date,
        updatedAt: now() as unknown as Date,
      });
    } else if (existingUsers[0].systemRole !== "system_admin") {
      // Backfill: legacy embed users may have been created with invalid role
      await db
        .update(users)
        .set({
          systemRole: "system_admin",
          updatedAt: now() as unknown as Date,
        })
        .where(eq(users.id, EMBEDDED_USER_ID));
    }

    // ── 2. Ensure a character exists for the requested Fenix OS user ────
    const existingChars = await db
      .select({ id: characters.id })
      .from(characters)
      .where(and(
        eq(characters.userId, EMBEDDED_USER_ID),
        eq(characters.name, characterName),
      ))
      .limit(1);

    let characterId: string;
    if (existingChars.length === 0) {
      const insertedCharacters = await db.insert(characters).values({
        userId: EMBEDDED_USER_ID,
        name: characterName,
        appearance: jsonForDb(pickAppearanceForName(characterName)) as unknown as string,
        createdAt: now() as unknown as Date,
        updatedAt: now() as unknown as Date,
      }).returning({ id: characters.id });
      characterId = insertedCharacters[0].id;
    } else {
      characterId = existingChars[0].id;
    }

    // ── 3. Ensure the default group exists ───────────────────────────────
    const existingGroups = await db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.slug, "fenix-hq"))
      .limit(1);

    let groupId: string;
    if (existingGroups.length === 0) {
      const crypto = await import("node:crypto");
      groupId = crypto.randomUUID();
      await db.insert(groups).values({
        id: groupId,
        name: "Fenix HQ",
        slug: "fenix-hq",
        isDefault: true,
        createdBy: EMBEDDED_USER_ID,
        createdAt: now() as unknown as Date,
        updatedAt: now() as unknown as Date,
      });
      // Add embed user as admin of the group
      await db.insert(groupMembers).values({
        groupId,
        userId: EMBEDDED_USER_ID,
        role: "admin",
        joinedAt: now() as unknown as Date,
      });
    } else {
      groupId = existingGroups[0].id;
    }

    // ── 4. Ensure "Fenix HQ" channel exists ────────────────────────────
    const existingChannels = await db
      .select({ id: channels.id })
      .from(channels)
      .where(and(
        eq(channels.ownerId, EMBEDDED_USER_ID),
        eq(channels.name, CHANNEL_NAME),
      ))
      .limit(1);

    const templateMapData = smallOfficeTemplate.tiledJson;
    const templateMapConfig = {
      cols: smallOfficeTemplate.cols,
      rows: smallOfficeTemplate.rows,
      spawnCol: smallOfficeTemplate.spawnCol,
      spawnRow: smallOfficeTemplate.spawnRow,
    };

    let channelId: string;
    if (existingChannels.length === 0) {
      const crypto = await import("node:crypto");
      channelId = crypto.randomUUID();
      await db.insert(channels).values({
        id: channelId,
        name: CHANNEL_NAME,
        description: "Escritório virtual da Fenix — powered by Claude Code",
        ownerId: EMBEDDED_USER_ID,
        groupId,
        isPublic: true,
        maxPlayers: 50,
        mapData: jsonForDb(templateMapData),
        mapConfig: jsonForDb(templateMapConfig),
        channelType: "hq",
        createdAt: now() as unknown as Date,
        updatedAt: now() as unknown as Date,
      });
    } else {
      channelId = existingChannels[0].id;
      // Backfill mapData for legacy channels created without a map
      const [existing] = await db
        .select({ mapData: channels.mapData, channelType: channels.channelType, parentChannelId: channels.parentChannelId })
        .from(channels)
        .where(eq(channels.id, channelId))
        .limit(1);
      if (!existing?.mapData || existing.channelType !== "hq" || existing.parentChannelId) {
        await db
          .update(channels)
          .set({
            ...(!existing?.mapData ? {
              mapData: jsonForDb(templateMapData),
              mapConfig: jsonForDb(templateMapConfig),
            } : {}),
            channelType: "hq",
            parentChannelId: null,
            updatedAt: now() as unknown as Date,
          })
          .where(eq(channels.id, channelId));
      }
    }

    return NextResponse.json({ channelId, characterId, characterName, ok: true });
  } catch (error) {
    console.error("[embed/setup] Error:", error);
    return NextResponse.json(
      { error: "Setup failed", detail: String(error) },
      { status: 500 },
    );
  }
}
