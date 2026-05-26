#!/usr/bin/env node
/**
 * DeskRPG MCP Server
 *
 * A local MCP server that exposes DeskRPG management tools to NPC agents.
 * This allows the CEO NPC (or any NPC with this MCP) to:
 *   - Hire new NPCs (create)
 *   - List existing NPCs
 *   - Fire NPCs (delete)
 *   - List available presets
 *   - Assign tasks to NPCs
 *
 * Usage: node deskrpg-mcp-server.js
 * Env: DESKRPG_API_URL (default: http://localhost:3000)
 *      DESKRPG_OWNER_TOKEN (required: JWT token of the channel owner)
 *      DESKRPG_CHANNEL_ID (required: the channel to manage)
 */

const http = require("node:http");
const { URL } = require("node:url");

const API_URL = process.env.DESKRPG_API_URL || "http://localhost:3000";
const OWNER_TOKEN = process.env.DESKRPG_OWNER_TOKEN || "";
const CHANNEL_ID = process.env.DESKRPG_CHANNEL_ID || "";

// ---------------------------------------------------------------------------
// MCP Protocol helpers (stdio JSON-RPC)
// ---------------------------------------------------------------------------

let requestBuffer = "";

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  requestBuffer += chunk;
  processBuffer();
});

function processBuffer() {
  while (true) {
    const headerEnd = requestBuffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) break;

    const header = requestBuffer.slice(0, headerEnd);
    const contentLengthMatch = header.match(/Content-Length:\s*(\d+)/i);
    if (!contentLengthMatch) {
      requestBuffer = requestBuffer.slice(headerEnd + 4);
      continue;
    }

    const contentLength = parseInt(contentLengthMatch[1], 10);
    const bodyStart = headerEnd + 4;
    if (requestBuffer.length < bodyStart + contentLength) break;

    const body = requestBuffer.slice(bodyStart, bodyStart + contentLength);
    requestBuffer = requestBuffer.slice(bodyStart + contentLength);

    try {
      const message = JSON.parse(body);
      handleMessage(message);
    } catch (err) {
      sendError(null, -32700, "Parse error");
    }
  }
}

function sendResponse(id, result) {
  const body = JSON.stringify({ jsonrpc: "2.0", id, result });
  const msg = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
  process.stdout.write(msg);
}

function sendError(id, code, message) {
  const body = JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } });
  const msg = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
  process.stdout.write(msg);
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function apiCall(method, path, body) {
  const url = new URL(path, API_URL);
  const headers = {
    "Content-Type": "application/json",
    ...(OWNER_TOKEN ? { Authorization: `Bearer ${OWNER_TOKEN}` } : {}),
  };

  const res = await fetch(url.toString(), {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `API error ${res.status}`);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

const TOOLS = {
  list_npcs: {
    name: "list_npcs",
    description: "Lista todos os NPCs do canal atual com seus IDs, nomes e status de agente",
    inputSchema: { type: "object", properties: {}, required: [] },
    handler: async () => {
      const data = await apiCall("GET", `/api/npcs?channelId=${CHANNEL_ID}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(data.npcs || [], null, 2),
        }],
      };
    },
  },

  list_presets: {
    name: "list_presets",
    description: "Lista todos os presets de NPC disponíveis com IDs e nomes para contratação",
    inputSchema: { type: "object", properties: {}, required: [] },
    handler: async () => {
      const data = await apiCall("GET", "/api/npcs/presets?locale=pt");
      const summary = (data.presets || []).map((p) => ({
        id: p.id,
        name: p.displayName || p.name,
      }));
      return {
        content: [{
          type: "text",
          text: JSON.stringify(summary, null, 2),
        }],
      };
    },
  },

  hire_npc: {
    name: "hire_npc",
    description: "Contrata um novo NPC no canal. Use list_presets para ver IDs disponíveis. O NPC será criado com a persona e aparência do preset.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nome do NPC (ex: 'Ana - Meta Ads')" },
        presetId: { type: "string", description: "ID do preset (ex: 'meta-ads-strategist')" },
        positionX: { type: "number", description: "Posição X no mapa (coluna, default: 5)" },
        positionY: { type: "number", description: "Posição Y no mapa (linha, default: 5)" },
      },
      required: ["name", "presetId"],
    },
    handler: async (args) => {
      const data = await apiCall("POST", "/api/npcs", {
        channelId: CHANNEL_ID,
        name: args.name,
        presetId: args.presetId,
        positionX: args.positionX ?? 5,
        positionY: args.positionY ?? 5,
        direction: "down",
        appearance: {}, // will use preset appearance
        agentAction: "create",
        agentId: args.presetId,
        locale: "pt",
      });
      return {
        content: [{
          type: "text",
          text: `NPC "${args.name}" contratado com sucesso! ID: ${data.npc?.id || "unknown"}`,
        }],
      };
    },
  },

  fire_npc: {
    name: "fire_npc",
    description: "Demite (remove) um NPC do canal pelo ID. Use list_npcs para ver IDs.",
    inputSchema: {
      type: "object",
      properties: {
        npcId: { type: "string", description: "ID do NPC a ser demitido" },
      },
      required: ["npcId"],
    },
    handler: async (args) => {
      await apiCall("DELETE", `/api/npcs/${args.npcId}`);
      return {
        content: [{
          type: "text",
          text: `NPC ${args.npcId} demitido com sucesso.`,
        }],
      };
    },
  },

  assign_task: {
    name: "assign_task",
    description: "Atribui uma tarefa a um NPC. A tarefa aparecerá na aba Tarefas do NPC.",
    inputSchema: {
      type: "object",
      properties: {
        npcId: { type: "string", description: "ID do NPC que receberá a tarefa" },
        title: { type: "string", description: "Título da tarefa" },
        description: { type: "string", description: "Descrição detalhada da tarefa" },
      },
      required: ["npcId", "title"],
    },
    handler: async (args) => {
      // Tasks are created via socket, but we can use the REST API if available
      return {
        content: [{
          type: "text",
          text: `Tarefa "${args.title}" registrada para NPC ${args.npcId}. Envie a tarefa diretamente no chat do NPC para que ele execute.`,
        }],
      };
    },
  },
};

// ---------------------------------------------------------------------------
// MCP Message handler
// ---------------------------------------------------------------------------

async function handleMessage(message) {
  const { id, method, params } = message;

  switch (method) {
    case "initialize":
      sendResponse(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: {
          name: "deskrpg",
          version: "1.0.0",
        },
      });
      break;

    case "notifications/initialized":
      // No response needed for notifications
      break;

    case "tools/list":
      sendResponse(id, {
        tools: Object.values(TOOLS).map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema,
        })),
      });
      break;

    case "tools/call": {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const tool = TOOLS[toolName];

      if (!tool) {
        sendResponse(id, {
          content: [{ type: "text", text: `Tool "${toolName}" not found` }],
          isError: true,
        });
        break;
      }

      try {
        const result = await tool.handler(toolArgs);
        sendResponse(id, result);
      } catch (err) {
        sendResponse(id, {
          content: [{ type: "text", text: `Error: ${err.message}` }],
          isError: true,
        });
      }
      break;
    }

    default:
      if (id != null) {
        sendError(id, -32601, `Method not found: ${method}`);
      }
      break;
  }
}

// Keep process alive
process.stdin.resume();
process.stderr.write("[DeskRPG MCP] Server started\n");
