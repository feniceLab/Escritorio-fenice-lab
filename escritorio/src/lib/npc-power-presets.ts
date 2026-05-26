/**
 * NPC Power Presets — per-squad default tools, MCP servers, and env var templates.
 *
 * Each squad defines:
 *   - allowedTools: which Claude Code tools the NPC can use
 *   - mcpServers: suggested MCP servers (user fills in tokens)
 *   - envVarKeys: env var names the NPC needs (user fills in values)
 *   - maxTurns / timeoutMs: per-squad execution limits
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface McpServerPreset {
  name: string;
  command: string;
  args: string[];
  envKeys: string[]; // keys that need user-provided values
  description: string;
}

export interface PowerPreset {
  squadId: string;
  label: string;
  description: string;
  allowedTools: string[];
  mcpServers: McpServerPreset[];
  envVarKeys: string[];
  maxTurns: number;
  timeoutMs: number;
}

// ---------------------------------------------------------------------------
// Base tool sets
// ---------------------------------------------------------------------------

const TOOLS_READONLY = ["Read", "Glob", "Grep", "WebFetch", "WebSearch"];
const TOOLS_WRITE = [...TOOLS_READONLY, "Write", "Edit", "Bash"];
const TOOLS_FULL = [...TOOLS_WRITE, "MultiEdit", "LS", "TodoRead", "TodoWrite"];

// ---------------------------------------------------------------------------
// Power Presets
// ---------------------------------------------------------------------------

export const POWER_PRESETS: PowerPreset[] = [
  // ── Meta Ads Squad ──────────────────────────────────────────────────
  {
    squadId: "meta-ads",
    label: "Meta Ads",
    description: "Gerenciamento de campanhas, criativos e relatórios do Meta Ads",
    allowedTools: TOOLS_WRITE,
    mcpServers: [
      {
        name: "facebook-ads",
        command: "npx",
        args: ["-y", "@anthropic/mcp-facebook-ads"],
        envKeys: ["FACEBOOK_ACCESS_TOKEN", "FACEBOOK_AD_ACCOUNT_ID"],
        description: "API do Facebook/Meta Ads Manager",
      },
    ],
    envVarKeys: ["FACEBOOK_ACCESS_TOKEN", "FACEBOOK_AD_ACCOUNT_ID", "FACEBOOK_APP_ID"],
    maxTurns: 15,
    timeoutMs: 300_000,
  },

  // ── Google Ads Squad ────────────────────────────────────────────────
  {
    squadId: "google-ads",
    label: "Google Ads",
    description: "Gerenciamento de campanhas, keywords e relatórios do Google Ads",
    allowedTools: TOOLS_WRITE,
    mcpServers: [
      {
        name: "google-ads",
        command: "npx",
        args: ["-y", "@anthropic/mcp-google-ads"],
        envKeys: ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CUSTOMER_ID"],
        description: "API do Google Ads",
      },
      {
        name: "google-sheets",
        command: "npx",
        args: ["-y", "@anthropic/mcp-google-sheets"],
        envKeys: ["GOOGLE_SHEETS_API_KEY"],
        description: "Google Sheets para relatórios",
      },
    ],
    envVarKeys: ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CUSTOMER_ID", "GOOGLE_SHEETS_API_KEY"],
    maxTurns: 15,
    timeoutMs: 300_000,
  },

  // ── Landing Page Squad ──────────────────────────────────────────────
  {
    squadId: "landing-page",
    label: "Landing Page",
    description: "Criação e deploy de landing pages, copy e design",
    allowedTools: TOOLS_FULL,
    mcpServers: [
      {
        name: "filesystem",
        command: "npx",
        args: ["-y", "@anthropic/mcp-filesystem"],
        envKeys: [],
        description: "Acesso ao sistema de arquivos local",
      },
    ],
    envVarKeys: ["VERCEL_TOKEN", "NETLIFY_TOKEN"],
    maxTurns: 25,
    timeoutMs: 600_000,
  },

  // ── Restaurante Marketing Squad ─────────────────────────────────────
  {
    squadId: "restaurant-marketing",
    label: "Marketing Restaurante",
    description: "Social media, CRM, WhatsApp e conteúdo para restaurantes",
    allowedTools: TOOLS_WRITE,
    mcpServers: [
      {
        name: "instagram",
        command: "npx",
        args: ["-y", "@anthropic/mcp-instagram"],
        envKeys: ["INSTAGRAM_ACCESS_TOKEN"],
        description: "API do Instagram para posts e stories",
      },
      {
        name: "whatsapp",
        command: "npx",
        args: ["-y", "@anthropic/mcp-whatsapp-business"],
        envKeys: ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID"],
        description: "WhatsApp Business API",
      },
    ],
    envVarKeys: [
      "INSTAGRAM_ACCESS_TOKEN",
      "WHATSAPP_TOKEN",
      "WHATSAPP_PHONE_ID",
      "FACEBOOK_PAGE_TOKEN",
    ],
    maxTurns: 15,
    timeoutMs: 300_000,
  },

  // ── RH Squad ────────────────────────────────────────────────────────
  {
    squadId: "hr",
    label: "RH",
    description: "Recrutamento, onboarding, treinamento e gestão de pessoas",
    allowedTools: TOOLS_WRITE,
    mcpServers: [
      {
        name: "google-calendar",
        command: "npx",
        args: ["-y", "@anthropic/mcp-google-calendar"],
        envKeys: ["GOOGLE_CALENDAR_API_KEY"],
        description: "Google Calendar para agendamentos",
      },
      {
        name: "gmail",
        command: "npx",
        args: ["-y", "@anthropic/mcp-gmail"],
        envKeys: ["GMAIL_API_KEY"],
        description: "Gmail para comunicações",
      },
    ],
    envVarKeys: ["GOOGLE_CALENDAR_API_KEY", "GMAIL_API_KEY"],
    maxTurns: 10,
    timeoutMs: 180_000,
  },

  // ── CEO / Gestão Squad ──────────────────────────────────────────────
  {
    squadId: "ceo",
    label: "CEO / Gestão",
    description: "Gerenciamento da operação: contratar NPCs, atribuir tarefas, coordenar squads",
    allowedTools: TOOLS_FULL,
    mcpServers: [
      {
        name: "deskrpg",
        command: "node",
        args: ["src/lib/deskrpg-mcp-server.js"],
        envKeys: ["DESKRPG_OWNER_TOKEN", "DESKRPG_CHANNEL_ID"],
        description: "DeskRPG Management — contratar, demitir, listar NPCs e atribuir tarefas",
      },
    ],
    envVarKeys: ["DESKRPG_OWNER_TOKEN", "DESKRPG_CHANNEL_ID", "DESKRPG_API_URL"],
    maxTurns: 30,
    timeoutMs: 600_000,
  },

  // ── Designer (Brand & Design System) ────────────────────────────────
  {
    squadId: "designer",
    label: "Designer / Branding",
    description: "Cria identidade visual, Design System, Brand Book e Storybook completo",
    allowedTools: TOOLS_FULL,
    mcpServers: [],
    envVarKeys: ["FIGMA_TOKEN", "CANVA_API_KEY"],
    maxTurns: 30,
    timeoutMs: 600_000,
  },

  // ── Brand Scraper (Intelligence) ──────────────────────────────────
  {
    squadId: "brand-scraper",
    label: "Brand Intelligence",
    description: "Analisa redes sociais do cliente e preenche a biblioteca com logo, cores, fontes e posts",
    allowedTools: [...TOOLS_FULL, "WebFetch", "WebSearch"],
    mcpServers: [],
    envVarKeys: [],
    maxTurns: 30,
    timeoutMs: 600_000,
  },

  // ── API Configurator ────────────────────────────────────────────────
  {
    squadId: "api-configurator",
    label: "Configurador de APIs",
    description: "Coleta e configura chaves de API do cliente para todos os agentes da sala",
    allowedTools: [...TOOLS_WRITE, "WebFetch"],
    mcpServers: [],
    envVarKeys: [],
    maxTurns: 20,
    timeoutMs: 300_000,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getPowerPreset(squadId: string): PowerPreset | null {
  return POWER_PRESETS.find((p) => p.squadId === squadId) || null;
}

export function getPowerPresetForNpcPreset(npcPresetId: string): PowerPreset | null {
  if (npcPresetId.startsWith("meta-ads")) return getPowerPreset("meta-ads");
  if (npcPresetId.startsWith("google-ads")) return getPowerPreset("google-ads");
  if (npcPresetId.startsWith("landing-page")) return getPowerPreset("landing-page");
  if (npcPresetId.startsWith("restaurant-") || npcPresetId.startsWith("restaurant_")) return getPowerPreset("restaurant-marketing");
  if (npcPresetId.startsWith("hr-")) return getPowerPreset("hr");
  if (npcPresetId.startsWith("ceo") || npcPresetId.startsWith("manager") || npcPresetId.startsWith("director")) return getPowerPreset("ceo");
  if (npcPresetId === "designer") return getPowerPreset("designer");
  if (npcPresetId === "brand-scraper") return getPowerPreset("brand-scraper");
  if (npcPresetId === "api-configurator") return getPowerPreset("api-configurator");
  return null;
}

/**
 * Builds a powers config ready for DB storage, given a preset and user-provided env values.
 */
export function buildPowersFromPreset(
  preset: PowerPreset,
  envValues: Record<string, string> = {},
): {
  allowedTools: string[];
  envVars: Record<string, string>;
  mcpServers: { name: string; command: string; args: string[]; env?: Record<string, string> }[];
  maxTurns: number;
  timeoutMs: number;
} {
  const envVars: Record<string, string> = {};
  for (const key of preset.envVarKeys) {
    if (envValues[key]) envVars[key] = envValues[key];
  }

  const mcpServers = preset.mcpServers.map((server) => {
    const env: Record<string, string> = {};
    for (const key of server.envKeys) {
      if (envValues[key]) env[key] = envValues[key];
    }
    return {
      name: server.name,
      command: server.command,
      args: server.args,
      ...(Object.keys(env).length > 0 ? { env } : {}),
    };
  });

  return {
    allowedTools: preset.allowedTools,
    envVars,
    mcpServers,
    maxTurns: preset.maxTurns,
    timeoutMs: preset.timeoutMs,
  };
}
