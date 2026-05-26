import { db } from "@/db";
import { channels, npcs } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getUserId, internalRpc } from "@/lib/internal-rpc";
import {
  bindGatewayToChannel,
  decryptGatewayToken,
  getAccessibleGatewayResource,
  getChannelGatewayBinding,
  unbindGatewayFromChannel,
  updateChannelTaskAutomationSettings,
  upsertOwnedGatewayResource,
} from "@/lib/gateway-resources";
import { buildGatewayConfig, mergeGatewayConfig } from "@/lib/task-reporting";
import { parseDbObject } from "@/lib/db-json";
import internalTransport from "@/lib/internal-transport.js";
import { getGatewayConfigUpdatedHandler } from "@/lib/rpc-registry";

const { buildInternalAuthHeaders, getInternalSocketBaseUrl } = internalTransport as {
  buildInternalAuthHeaders: () => Record<string, string>;
  getInternalSocketBaseUrl: () => string;
};

function buildResponseGatewayConfig(input: {
  userId: string;
  channelGatewayConfig: unknown;
  binding: Awaited<ReturnType<typeof getChannelGatewayBinding>>;
}) {
  const taskAutomation = buildGatewayConfig(input.channelGatewayConfig).taskAutomation;
  const boundGateway = input.binding?.resource ?? null;
  const canEditCredentials = !boundGateway || boundGateway.ownerUserId === input.userId;

  return {
    gatewayId: boundGateway?.id ?? null,
    displayName: boundGateway?.displayName ?? null,
    url: boundGateway?.baseUrl ?? null,
    token: boundGateway && canEditCredentials ? decryptGatewayToken(boundGateway.tokenEncrypted) : null,
    provider: boundGateway?.provider ?? "openclaw",
    workspacePath: boundGateway?.workspacePath ?? null,
    canEditCredentials,
    taskAutomation,
  };
}

type GatewayAgentRecord = {
  id?: string;
  name?: string;
  workspace?: string;
};

function normalizeGatewayAgents(result: unknown): GatewayAgentRecord[] {
  if (Array.isArray(result)) return result as GatewayAgentRecord[];
  if (result && typeof result === "object" && Array.isArray((result as { agents?: unknown[] }).agents)) {
    return (result as { agents: GatewayAgentRecord[] }).agents;
  }
  return [];
}

function buildNpcAgentFiles(openclawConfig: Record<string, unknown>) {
  const personaConfig = openclawConfig.personaConfig && typeof openclawConfig.personaConfig === "object"
    ? openclawConfig.personaConfig as Record<string, unknown>
    : null;
  const passPolicy = typeof openclawConfig.passPolicy === "string" ? openclawConfig.passPolicy.trim() : "";
  const identity = typeof personaConfig?.identity === "string"
    ? personaConfig.identity
    : typeof openclawConfig.persona === "string"
      ? openclawConfig.persona
      : "";
  const soul = typeof personaConfig?.soul === "string" ? personaConfig.soul : "";
  const meetingProtocol = typeof openclawConfig.meetingProtocol === "string" ? openclawConfig.meetingProtocol : "";

  const identityContent = identity
    ? [
        identity.trim(),
        passPolicy
          ? [
              "",
              "## Meeting Guardrails",
              "",
              passPolicy,
            ].join("\n")
          : "",
      ].filter(Boolean).join("\n")
    : "";

  return [
    identityContent ? { name: "IDENTITY.md" as const, content: identityContent } : null,
    soul.trim() ? { name: "SOUL.md" as const, content: soul.trim() } : null,
    meetingProtocol.trim() ? { name: "AGENTS.md" as const, content: meetingProtocol.trim() } : null,
  ].filter((file): file is { name: "IDENTITY.md" | "SOUL.md" | "AGENTS.md"; content: string } => Boolean(file));
}

export async function syncChannelNpcAgentsToGateway(channelId: string) {
  const channelNpcs = await db
    .select({ id: npcs.id, name: npcs.name, openclawConfig: npcs.openclawConfig })
    .from(npcs)
    .where(eq(npcs.channelId, channelId));

  if (channelNpcs.length === 0) {
    return { processedAgents: 0, fileWrites: 0, warnings: [] as string[] };
  }

  const existingAgents = new Set(
    normalizeGatewayAgents(await internalRpc(channelId, "agents.list"))
      .map((agent) => typeof agent.id === "string" ? agent.id : "")
      .filter(Boolean),
  );

  let processedAgents = 0;
  let fileWrites = 0;
  const warnings: string[] = [];

  for (const npc of channelNpcs) {
    const openclawConfig = parseDbObject(npc.openclawConfig);
    const agentId = typeof openclawConfig?.agentId === "string" ? openclawConfig.agentId : null;
    if (!agentId) continue;

    if (!existingAgents.has(agentId)) {
      try {
        await internalRpc(channelId, "agents.create", {
          name: agentId,
          workspace: `~/.openclaw/workspace-${agentId}`,
        });
        existingAgents.add(agentId);
      } catch (error) {
        warnings.push(
          `Failed to create agent ${agentId} for NPC ${npc.name}: ${
            error instanceof Error ? error.message : "unknown error"
          }`,
        );
      }
    }

    const files = buildNpcAgentFiles(openclawConfig || {});
    for (const file of files) {
      try {
        await internalRpc(channelId, "agents.files.set", {
          agentId,
          name: file.name,
          content: file.content,
        });
        fileWrites += 1;
      } catch (error) {
        warnings.push(
          `Failed to sync ${file.name} for agent ${agentId}: ${
            error instanceof Error ? error.message : "unknown error"
          }`,
        );
      }
    }

    processedAgents += 1;
  }

  return { processedAgents, fileWrites, warnings };
}

async function emitGatewayConfigUpdated(channelId: string) {
  const localHandler = getGatewayConfigUpdatedHandler();
  if (localHandler) {
    await localHandler(channelId);
    return;
  }

  try {
    await fetch(`${getInternalSocketBaseUrl()}/_internal/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...buildInternalAuthHeaders(),
      },
      body: JSON.stringify({
        event: "gateway:config-updated",
        room: channelId,
        payload: { channelId },
      }),
    });
  } catch {
    console.warn("Failed to emit gateway:config-updated socket event");
  }
}

async function getChannelWithOwner(channelId: string) {
  const [channel] = await db
    .select({ ownerId: channels.ownerId, gatewayConfig: channels.gatewayConfig })
    .from(channels)
    .where(eq(channels.id, channelId))
    .limit(1);
  return channel ?? null;
}

// GET /api/channels/:id/gateway — owner-only, returns bound gateway resource + task automation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ errorCode: "unauthorized", error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const channel = await getChannelWithOwner(id);
  if (!channel) return NextResponse.json({ errorCode: "not_found", error: "not found" }, { status: 404 });
  if (channel.ownerId !== userId) return NextResponse.json({ errorCode: "forbidden", error: "forbidden" }, { status: 403 });

  const binding = await getChannelGatewayBinding(id);

  return NextResponse.json({
    gatewayConfig: buildResponseGatewayConfig({
      userId,
      channelGatewayConfig: channel.gatewayConfig,
      binding,
    }),
  });
}

// PUT /api/channels/:id/gateway — owner-only, binds a gateway resource or creates an owned one
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ errorCode: "unauthorized", error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const channel = await getChannelWithOwner(id);
  if (!channel) return NextResponse.json({ errorCode: "not_found", error: "not found" }, { status: 404 });
  if (channel.ownerId !== userId) return NextResponse.json({ errorCode: "forbidden", error: "forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: "invalid_json", error: "invalid JSON" }, { status: 400 });
  }

  const currentBinding = await getChannelGatewayBinding(id);
  const mergedGatewayConfig = mergeGatewayConfig(channel.gatewayConfig, body);

  let nextGatewayId: string | null = currentBinding?.resource.id ?? null;
  if (typeof body.gatewayId === "string" && body.gatewayId.trim()) {
    const accessible = await getAccessibleGatewayResource(userId, body.gatewayId.trim());
    if (!accessible) {
      return NextResponse.json(
        { errorCode: "gateway_access_denied", error: "Gateway access denied" },
        { status: 403 },
      );
    }
    const requestedProvider = typeof body.provider === "string" && body.provider.trim()
      ? body.provider.trim()
      : null;
    const savedProvider = accessible.resource.provider || "openclaw";
    if (requestedProvider && requestedProvider !== savedProvider) {
      return NextResponse.json(
        {
          errorCode: "gateway_provider_mismatch",
          error: `Selected gateway provider is ${savedProvider}, but the request expected ${requestedProvider}.`,
        },
        { status: 400 },
      );
    }
    nextGatewayId = accessible.resource.id;
  } else if (body.provider === "claude-code" || body.provider === "codex") {
    const provider = body.provider === "codex" ? "codex" : "claude-code";
    const resource = await upsertOwnedGatewayResource({
      ownerUserId: userId,
      baseUrl: provider === "codex" ? "local://codex" : "local://claude-code",
      token: provider === "codex" ? "codex-cli-auth" : "claude-code-max-plan",
      displayName: provider === "codex" ? "Codex" : "Claude Code",
      provider,
      workspacePath: typeof body.workspacePath === "string" ? body.workspacePath : null,
    });
    nextGatewayId = resource.id;
  } else if (Object.hasOwn(body, "url")) {
    if (!mergedGatewayConfig.url) {
      nextGatewayId = null;
    } else {
      const resource = await upsertOwnedGatewayResource({
        ownerUserId: userId,
        baseUrl: mergedGatewayConfig.url,
        token: mergedGatewayConfig.token ?? "",
        displayName: typeof body.displayName === "string" ? body.displayName : undefined,
      });
      nextGatewayId = resource.id;
    }
  }

  const previousGatewayId = currentBinding?.resource.id ?? null;
  const isBindingChanging = previousGatewayId !== nextGatewayId;

  if (nextGatewayId) {
    await bindGatewayToChannel({
      channelId: id,
      gatewayId: nextGatewayId,
      boundByUserId: userId,
    });
  } else {
    await unbindGatewayFromChannel(id);
  }

  await updateChannelTaskAutomationSettings(id, {
    taskAutomation: mergedGatewayConfig.taskAutomation,
  });

  await emitGatewayConfigUpdated(id);

  let migration: {
    processedAgents: number;
    fileWrites: number;
    warnings: string[];
  } | null = null;

  if (nextGatewayId && isBindingChanging) {
    try {
      migration = await syncChannelNpcAgentsToGateway(id);
    } catch (error) {
      migration = {
        processedAgents: 0,
        fileWrites: 0,
        warnings: [
          error instanceof Error ? error.message : "Failed to sync NPC agents to the new gateway",
        ],
      };
    }
  }

  const nextBinding = await getChannelGatewayBinding(id);
  return NextResponse.json({
    ok: true,
    preservedNpcContext: true,
    migration,
    gatewayConfig: buildResponseGatewayConfig({
      userId,
      channelGatewayConfig: {
        taskAutomation: mergedGatewayConfig.taskAutomation,
      },
      binding: nextBinding,
    }),
  });
}

// DELETE /api/channels/:id/gateway — owner-only, unbinds the channel gateway but preserves NPC data
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ errorCode: "unauthorized", error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const channel = await getChannelWithOwner(id);
  if (!channel) return NextResponse.json({ errorCode: "not_found", error: "not found" }, { status: 404 });
  if (channel.ownerId !== userId) return NextResponse.json({ errorCode: "forbidden", error: "forbidden" }, { status: 403 });

  await unbindGatewayFromChannel(id);
  await emitGatewayConfigUpdated(id);

  return NextResponse.json({
    ok: true,
    preservedNpcContext: true,
    gatewayConfig: buildResponseGatewayConfig({
      userId,
      channelGatewayConfig: channel.gatewayConfig,
      binding: null,
    }),
  });
}
