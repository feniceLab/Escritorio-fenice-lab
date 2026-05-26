import { db, channelLibraryItems, npcs, isPostgres, jsonForDb } from "@/db";
import { eq } from "drizzle-orm";
import { parseDbJson } from "@/lib/db-json";

interface EnvVar {
  key: string;
  value: string;
}

interface NpcPowers {
  envVars?: EnvVar[];
  mcpServers?: unknown[];
  allowedTools?: string[];
  maxTurns?: number;
  timeoutMs?: number;
}

interface OpenclawConfig {
  agentId?: string;
  personaConfig?: unknown;
  powers?: NpcPowers;
  [key: string]: unknown;
}

/**
 * Sync channel-level API keys from the library to all NPCs in the channel.
 * Channel-level keys are merged into each NPC's powers.envVars without
 * overwriting NPC-specific keys that already exist.
 */
export async function syncChannelApiKeysToNpcs(channelId: string): Promise<void> {
  try {
    // 1. Get all API layer items from the library
    const apiItems = await db
      .select({ name: channelLibraryItems.name, content: channelLibraryItems.content })
      .from(channelLibraryItems)
      .where(eq(channelLibraryItems.channelId, channelId));

    const channelKeys: EnvVar[] = apiItems
      .filter((i) => i.content)
      .map((i) => ({ key: i.name, value: i.content! }));

    if (channelKeys.length === 0) return;

    // 2. Get all NPCs in the channel
    const npcRows = await db
      .select({ id: npcs.id, openclawConfig: npcs.openclawConfig })
      .from(npcs)
      .where(eq(npcs.channelId, channelId));

    // 3. Merge channel keys into each NPC's powers.envVars
    for (const npc of npcRows) {
      const config: OpenclawConfig = (
        typeof npc.openclawConfig === "string"
          ? parseDbJson(npc.openclawConfig)
          : npc.openclawConfig
      ) as OpenclawConfig ?? {};

      const powers: NpcPowers = config.powers ?? {};
      const existingKeys = new Set((powers.envVars ?? []).map((e) => e.key));

      // Only add channel keys that don't already exist at NPC level
      const merged = [...(powers.envVars ?? [])];
      for (const ck of channelKeys) {
        if (!existingKeys.has(ck.key)) {
          merged.push(ck);
        }
      }

      config.powers = { ...powers, envVars: merged };

      const now = isPostgres ? new Date() : new Date().toISOString();
      await db
        .update(npcs)
        .set({
          openclawConfig: jsonForDb(config) as string,
          updatedAt: now as unknown as Date,
        })
        .where(eq(npcs.id, npc.id));
    }
  } catch (err) {
    console.error("Failed to sync channel API keys to NPCs:", err);
  }
}
