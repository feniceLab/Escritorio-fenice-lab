import { NextRequest, NextResponse } from "next/server";
import { db, jsonForDb } from "@/db";
import { npcs, channels } from "@/db";
import { eq, count, inArray } from "drizzle-orm";
import { getUserId } from "@/lib/internal-rpc";
import { injectTaskPrompt } from "@/lib/task-prompt";
import {
  buildPersonaConfig,
  getDefaultMeetingProtocol,
  getNpcPresetDefaults,
  hasNpcPresetDefaults,
  localizeNpcPromptDocument,
} from "@/lib/npc-agent-defaults";
import { normalizeLocale } from "@/lib/i18n/server";
import { parseDbJson, parseDbObject } from "@/lib/db-json";
import { getPowerPresetForNpcPreset, buildPowersFromPreset } from "@/lib/npc-power-presets";

export async function GET(req: NextRequest) {
  try {
    const channelId = req.nextUrl.searchParams.get("channelId");
    const channelIdsParam = req.nextUrl.searchParams.get("channelIds");
    const requestedChannelIds = channelIdsParam
      ? Array.from(new Set(
          channelIdsParam
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
        ))
      : [];
    let rows;

    if (requestedChannelIds.length > 0) {
      const userId = getUserId(req);
      if (!userId) {
        return NextResponse.json({ errorCode: "unauthorized", error: "Unauthorized" }, { status: 401 });
      }

      const channelRows = await db
        .select({
          id: channels.id,
          ownerId: channels.ownerId,
        })
        .from(channels)
        .where(inArray(channels.id, requestedChannelIds));

      if (channelRows.length !== requestedChannelIds.length || channelRows.some((channel) => channel.ownerId !== userId)) {
        return NextResponse.json({ errorCode: "forbidden", error: "forbidden" }, { status: 403 });
      }

      rows = await db.select().from(npcs).where(inArray(npcs.channelId, requestedChannelIds));
    } else if (channelId) {
      rows = await db.select().from(npcs).where(eq(npcs.channelId, channelId));
    } else {
      rows = await db.select().from(npcs);
    }

    const resolvedChannelIds = Array.from(new Set(rows.map((npc) => npc.channelId).filter(Boolean)));
    const channelRows = resolvedChannelIds.length > 0
      ? await db
          .select({
            id: channels.id,
            name: channels.name,
            clientName: channels.clientName,
            channelType: channels.channelType,
          })
          .from(channels)
          .where(inArray(channels.id, resolvedChannelIds))
      : [];
    const channelById = new Map(channelRows.map((channel) => [channel.id, channel] as const));

    const result = rows.map((npc) => {
      const openclawConfig = parseDbObject(npc.openclawConfig);
      const appearance = parseDbJson<unknown>(npc.appearance) ?? npc.appearance;
      const personaConfig = openclawConfig?.personaConfig as { identity?: string; soul?: string } | undefined;
      const commandCenter = openclawConfig?.commandCenter && typeof openclawConfig.commandCenter === "object"
        ? openclawConfig.commandCenter as Record<string, unknown>
        : null;
      const room = channelById.get(npc.channelId);

      return {
      id: npc.id,
      channelId: npc.channelId,
      channelName: room?.name ?? null,
      clientName: room?.clientName ?? null,
      channelType: room?.channelType ?? null,
      roomLabel: room?.clientName?.trim() || room?.name || null,
      name: npc.name,
      positionX: npc.positionX,
      positionY: npc.positionY,
      direction: npc.direction,
      appearance,
      hasAgent: !!openclawConfig?.agentId,
      agentId: (openclawConfig?.agentId as string) || null,
      runtimeProvider: (openclawConfig?.runtimeProvider as string) || null,
      model: (openclawConfig?.model as string) || null,
      reportsToId: npc.reportsToId ?? null,
      identity: personaConfig?.identity || (openclawConfig?.persona as string) || "",
      soul: personaConfig?.soul || "",
      powers: openclawConfig?.powers ?? null,
      passPolicy: (openclawConfig?.passPolicy as string) || null,
      presetId: (openclawConfig?.presetId as string) || null,
      meetingProtocol: (openclawConfig?.meetingProtocol as string) || null,
      totalTokens: npc.totalTokens,
      automationRules: Array.isArray(commandCenter?.automationRules) ? commandCenter?.automationRules : [],
    };
    });
    return NextResponse.json({ npcs: result });
  } catch (err) {
    console.error("Failed to fetch NPCs:", err);
    return NextResponse.json({ errorCode: "failed_to_fetch_npcs", error: "Failed to fetch NPCs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ errorCode: "unauthorized", error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      channelId, name, persona, appearance, positionX, positionY, direction,
      agentId, agentAction, identity, soul, presetId, locale,
      runtimeProvider,
      model,
      powers: rawPowers,
    } = body;
    const normalizedLocale = normalizeLocale(locale);

    if (!channelId || !name?.trim() || !appearance || positionX == null || positionY == null) {
      return NextResponse.json({ errorCode: "missing_required_fields", error: "Missing required fields" }, { status: 400 });
    }

    if (presetId && !hasNpcPresetDefaults(presetId)) {
      return NextResponse.json({ errorCode: "unknown_preset_id", error: `Unknown presetId: ${presetId}` }, { status: 400 });
    }

    // Allow iterative NPC creation even without an initial persona/identity.
    // Many office flows create the NPC first and refine prompt/soul/role later.

    // Verify channel ownership
    const [channel] = await db.select().from(channels).where(eq(channels.id, channelId));
    if (!channel) return NextResponse.json({ errorCode: "channel_not_found", error: "Channel not found" }, { status: 404 });
    if (channel.ownerId !== userId) return NextResponse.json({ errorCode: "only_channel_owner_can_hire_npcs", error: "Only channel owner can hire NPCs" }, { status: 403 });

    // No fixed NPC count limit per channel.
    // We intentionally allow the office to scale to as many NPCs as needed,
    // leaving performance/UX management to later operational controls instead
    // of hard-blocking creation at a small static threshold.
    await db.select({ value: count() }).from(npcs).where(eq(npcs.channelId, channelId));

    // Build openclawConfig based on agent action
    let openclawConfig: Record<string, unknown>;
    const presetDefaults = hasNpcPresetDefaults(presetId)
      ? getNpcPresetDefaults({ presetId, npcName: name.trim(), locale: normalizedLocale })
      : null;
    const resolvedIdentity = identity?.trim() || persona?.trim() || presetDefaults?.identity || "";
    const resolvedSoul = soul?.trim() || presetDefaults?.soul || "";

    // Resolve powers: use explicit powers from body, or auto-detect from preset squad
    let resolvedPowers = rawPowers && typeof rawPowers === "object" ? rawPowers : null;
    if (!resolvedPowers && presetId) {
      const powerPreset = getPowerPresetForNpcPreset(presetId);
      if (powerPreset) {
        resolvedPowers = buildPowersFromPreset(powerPreset, rawPowers?.envVars || {});
      }
    }

    if (agentAction === "create" && agentId) {
      const personaConfig = hasNpcPresetDefaults(presetId)
        ? buildPersonaConfig({
            presetId,
            npcName: name.trim(),
            locale: normalizedLocale,
            identityOverride: identity?.trim(),
            soulOverride: soul?.trim(),
            fallbackPersona: persona?.trim(),
          })
        : {
            identity: injectTaskPrompt(localizeNpcPromptDocument(resolvedIdentity, normalizedLocale, "identity"), normalizedLocale),
            soul: localizeNpcPromptDocument(resolvedSoul, normalizedLocale, "soul"),
          };
      // Agent was already created via /api/npcs/create-agent
      openclawConfig = {
        agentId,
        sessionKeyPrefix: `ot-${channelId.slice(0, 8)}-${agentId}`,
        personaConfig,
        locale: normalizedLocale,
      };
    } else if (agentAction === "select" && agentId) {
      // Select an existing agent on the gateway
      openclawConfig = {
        agentId,
        sessionKeyPrefix: `ot-${channelId.slice(0, 8)}-${agentId}`,
        locale: normalizedLocale,
      };
    } else {
      // No agent — backward compat: store persona in openclawConfig
      const identityText = resolvedIdentity;
      const personaConfig = identityText || resolvedSoul
        ? (
          hasNpcPresetDefaults(presetId)
            ? buildPersonaConfig({
                presetId,
                npcName: name.trim(),
                locale: normalizedLocale,
                identityOverride: identity?.trim(),
                soulOverride: soul?.trim(),
                fallbackPersona: persona?.trim(),
              })
            : {
                identity: injectTaskPrompt(localizeNpcPromptDocument(identityText, normalizedLocale, "identity"), normalizedLocale),
                soul: localizeNpcPromptDocument(resolvedSoul, normalizedLocale, "soul"),
              }
        )
        : null;
      openclawConfig = {
        agentId: null,
        sessionKeyPrefix: "",
        persona: identityText.slice(0, 500), // backward compat
        locale: normalizedLocale,
        meetingProtocol: getDefaultMeetingProtocol(normalizedLocale),
        ...(personaConfig ? { personaConfig } : {}),
      };
    }

    // Attach powers to openclawConfig
    if (resolvedPowers) {
      openclawConfig.powers = resolvedPowers;
    }
    if (typeof runtimeProvider === "string" && runtimeProvider.trim() && runtimeProvider !== "channel-default") {
      openclawConfig.runtimeProvider = runtimeProvider.trim();
    }
    if (typeof model === "string" && model.trim()) {
      openclawConfig.model = model.trim();
    }

    // Resolve appearance: if empty/null and we have a preset, use preset defaults
    let resolvedAppearance = appearance;
    if ((!resolvedAppearance || Object.keys(resolvedAppearance).length === 0) && presetDefaults?.appearance) {
      resolvedAppearance = presetDefaults.appearance;
    }

    // Insert NPC
    const [npc] = await db.insert(npcs).values({
      channelId,
      name: name.trim().slice(0, 100),
      positionX,
      positionY,
      direction: ["up", "down", "left", "right"].includes(direction) ? direction : "down",
      appearance: jsonForDb(resolvedAppearance),
      openclawConfig: jsonForDb(openclawConfig),
    }).returning();

    return NextResponse.json({
      npc: {
        ...npc,
        appearance: parseDbJson(npc.appearance) ?? npc.appearance,
        openclawConfig: parseDbObject(npc.openclawConfig) ?? npc.openclawConfig,
      },
    }, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") {
      return NextResponse.json({ errorCode: "tile_already_occupied", error: "This tile is already occupied" }, { status: 409 });
    }
    console.error("Failed to create NPC:", err);
    return NextResponse.json({ errorCode: "failed_to_create_npc", error: "Failed to create NPC" }, { status: 500 });
  }
}
