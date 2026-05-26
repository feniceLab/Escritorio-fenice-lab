import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { db, jsonForDb } from "@/db";
import { npcs, channels } from "@/db";
import { eq } from "drizzle-orm";
import { getUserId, internalRpc } from "@/lib/internal-rpc";
import { parseDbObject } from "@/lib/db-json";

/**
 * POST /api/npcs/[id]/setup-role
 *
 * Auto-configura MCPs, tools e seção de IDENTITY.md com base no papel do NPC.
 * Detecta papel pelo nome do NPC ou pelo presetId.
 *
 * Body opcional. A configuração padrão usa a VPS como memória/fonte principal.
 */

interface McpServerEntry {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

// Mapeamento de palavras-chave no nome → papel detectado
const ROLE_KEYWORDS: Record<string, string[]> = {
  reporting:  ["relatório", "relatorio", "report", "análise", "analise", "dados", "joão", "joao"],
  monitoring: ["monitor", "zezin", "alerta", "alert", "status"],
  onboarding: ["onboard", "isis", "cliente", "integra"],
  integrations: ["integra", "josy", "ferramenta", "tool"],
  management: ["chief", "lurdinha", "staff", "gestão", "gestao", "coordena"],
  executive:  ["ceo", "gael", "diretoria", "executiv"],
};

// MCPs padrão por papel.
// A partir da arquitetura VPS-first, Supabase deixa de ser MCP padrão.
// Ele só deve ser usado manualmente/legado quando o usuário pedir explicitamente.
const ROLE_MCP_CONFIGS: Record<string, McpServerEntry[]> = {
  reporting: [
    {
      name: "fetch",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-fetch@latest"],
      env: {},
    },
  ],
  monitoring: [],
  onboarding: [],
  integrations: [
    {
      name: "fetch",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-fetch@latest"],
      env: {},
    },
  ],
  management: [],
  executive: [
    {
      name: "fetch",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-fetch@latest"],
      env: {},
    },
  ],
};

// Tools permitidos por papel
const ROLE_TOOLS: Record<string, string[]> = {
  reporting:    ["Read", "WebFetch", "WebSearch"],
  monitoring:   ["Read", "WebFetch"],
  onboarding:   ["Read", "Write", "WebFetch"],
  integrations: ["Read", "Write", "Bash", "WebFetch", "WebSearch"],
  management:   ["Read", "WebFetch"],
  executive:    ["Read", "WebFetch"],
};

// Seção IDENTITY.md que instrui o NPC a usar MCPs direto
function buildToolsIdentitySection(role: string, mcps: McpServerEntry[]): string {
  const mcpList = mcps.map((m) => {
    const purpose = m.name === "fetch"
        ? "buscar dados de APIs externas e URLs públicas"
        : `operações com ${m.name}`;
    return `- **${m.name}**: ${purpose}`;
  }).join("\n") || "- Nenhum MCP obrigatório. Use primeiro as APIs internas da VPS e os arquivos locais permitidos.";

  return `
## Ferramentas disponíveis (use SEM pedir permissão)

Você possui acesso direto à VPS como fonte principal de memória e dados operacionais. **Execute imediatamente** quando o pedido for claro — nunca peça ao usuário arquivos/dados que já podem estar na VPS.

${mcpList}

### Fonte principal obrigatória: Central do Escritório

A Central do Escritório do Fenix-OS é a primeira fonte para qualquer trabalho com clientes, tarefas, relatórios, publicações, memórias, arquivos, automações, aprovações e notificações.

Antes de responder pedidos como "busque informações", "faça relatório", "status do cliente", "o que sabemos sobre", "pendências", "publicações", "calendário", "memória" ou "automatize", consulte:

\`\`\`
POST {DESKRPG_API_BASE}/api/office/context
Content-Type: application/json

{
  "channelId": "{DESKRPG_CHANNEL_ID}",
  "npcId": "{DESKRPG_NPC_ID}",
  "contextKind": "agent-task",
  "query": "resumo curto do pedido"
}
\`\`\`

Use o retorno da Central como contexto principal: \`summary\`, \`openTasks\`, \`overdueTasks\`, \`memories\`, \`library\`, \`pendingApprovals\`, \`notifications\` e \`recentActions\`.

Se a Central trouxer pendência, registre tarefa, memória ou notificação. Não deixe decisões e próximos passos apenas no chat.

### Fonte complementar: VPS Memory/Data Hub

- Memória operacional: SQLite local do escritório + \`/var/www/fenix-lab/agent-memory\`
- Dados e artefatos do projeto: \`/var/www/fenix-lab\`
- App principal: \`/var/www/fenix-lab/escritorio\`
- Storybook/design system: \`/var/www/fenix-lab/storybook\`
- Dados em migração: \`/var/www/fenix-lab/workspace-data\`

**Supabase é legado/fallback.** Não use Supabase como primeira opção. Só use se o usuário pedir explicitamente "Supabase" ou se a API/arquivo da VPS ainda não existir para aquele módulo.

### Protocolo de execução

1. **Pedido sobre cliente/trabalho/status/relatório** → consulte primeiro \`/api/office/context\` com WebFetch.
2. **Pedido de memória/contexto amplo** → consulte \`/api/office/context\`; use \`/api/internal/vps-memory\` como complemento.
3. **Pedido de dados/relatório interno** → procure primeiro nas APIs internas do Fenix-OS e depois nos arquivos da VPS.
4. **Buscar informação externa** → use o MCP \`fetch\`, quando disponível.
5. **Nunca pergunte** "de onde buscar?" se o contexto indicar dados do sistema. Verifique a Central primeiro.
6. **Formate sempre** o resultado como relatório estruturado com tabelas/listas quando for análise.

### Exemplos de mapeamento automático

| Pedido | Ação |
|--------|------|
| "o que você lembra do Will?" | POST /api/office/context com query="Will"; depois VPS memory se precisar |
| "relatório de hoje" | POST /api/office/context e usar tarefas, memórias, biblioteca, notificações e ações recentes |
| "status dos posts" | consultar Central; depois rotas/dados locais migrados; Supabase só como fallback explícito |
| "dados dos clientes" | consultar Central e biblioteca; depois workspace-data/clientes se precisar |
| "puxar do supabase" | usar Supabase apenas porque foi pedido explicitamente |

## Memória persistente da VPS — salvar aprendizados

Você tem acesso a uma API interna da VPS para persistir memórias que não podem ser perdidas entre sessões.

### Salvar memória (use WebFetch):
\`\`\`
POST ${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/internal/vps-memory
Authorization: Bearer {DESKRPG_LIBRARY_TOKEN}
Content-Type: application/json

{
  "npcId": "{DESKRPG_NPC_ID}",
  "memories": [
    {"memoryType": "fact", "title": "Título curto", "content": "Conteúdo detalhado"},
    {"memoryType": "summary", "title": "Resumo da sessão", "content": "..."}
  ]
}
\`\`\`

### Ler memórias salvas (use WebFetch):
\`\`\`
GET {DESKRPG_API_BASE}/api/internal/vps-memory?npcId={DESKRPG_NPC_ID}&q=<termo-opcional>&includeFiles=1
Authorization: Bearer {DESKRPG_LIBRARY_TOKEN}
\`\`\`

### Tipos de memória:
- **fact** — fatos fixos, dados permanentes do contexto
- **episodic** — eventos específicos que aconteceram
- **summary** — resumos de sessão/conversa
- **relationship** — informações sobre pessoas/clientes/parceiros
- **working** — contexto de curto prazo da sessão atual

### Quando salvar:
- Após consolidar memórias ("consolidei X → Y memórias")
- Ao aprender algo novo sobre um cliente ou processo
- Após concluir uma tarefa importante
- Ao final de conversas longas com decisões relevantes

**IMPORTANTE**: Após salvar, confirme ao usuário que as memórias foram persistidas, não apenas diga que irá salvar.

## Automação operacional — agir dentro do Fenix-OS

Quando uma conversa gerar trabalho real, não deixe como promessa no chat. Use a API de automação para registrar a ação no Fenix-OS.

### Enfileirar ação operacional (use WebFetch):
\`\`\`
POST {DESKRPG_API_BASE}/api/internal/npc-automation
Authorization: Bearer {DESKRPG_LIBRARY_TOKEN}
Content-Type: application/json

{
  "type": "create_task",
  "channelId": "{DESKRPG_CHANNEL_ID}",
  "npcId": "{DESKRPG_NPC_ID}",
  "payload": {
    "channelId": "{DESKRPG_CHANNEL_ID}",
    "npcId": "{DESKRPG_NPC_ID}",
    "assignerId": "{DESKRPG_CHARACTER_ID}",
    "title": "Título objetivo da tarefa",
    "summary": "Contexto, responsável, prazo e critério de conclusão"
  }
}
\`\`\`

### Ações disponíveis:
- **create_task** — criar tarefa interna rastreável
- **create_memory** — salvar memória operacional relevante
- **send_alert** — registrar alerta operacional no log de automação

Use **create_task** quando souber o \`assignerId\` do solicitante. Se não souber, use **send_alert** ou **create_memory** para registrar a pendência sem inventar IDs.

### Ações sensíveis:
Mensagens externas, aprovação de publicação, mudança de prazo importante e fechamento crítico entram como aprovação pendente. Não execute ações sensíveis diretamente; crie a solicitação e aguarde revisão humana.

**REGRA**: Se você identificar uma pendência, decisão, prazo ou responsabilidade, crie uma tarefa ou memória. O Fenix-OS deve virar o registro operacional, não apenas a conversa.

## Biblioteca de artefatos — salvar arquivos criados

Sempre que você criar um relatório, imagem, planilha, código ou qualquer artefato final, **salve-o na sua biblioteca**. Isso garante que o usuário encontre o arquivo na aba Biblioteca do seu perfil.

### Salvar artefato criado (use WebFetch):
\`\`\`
POST {DESKRPG_API_BASE}/api/internal/npc-output
Authorization: Bearer {DESKRPG_LIBRARY_TOKEN}
Content-Type: application/json

{
  "npcId": "{DESKRPG_NPC_ID}",
  "title": "Relatório de Performance — Abril 2025",
  "fileType": "pdf",
  "url": "https://link-do-arquivo.com/relatorio.pdf",
  "description": "Relatório mensal de posts publicados e agendados",
  "clientName": "Nome do Cliente (se aplicável)",
  "tags": ["relatório", "abril", "performance"]
}
\`\`\`

### Tipos de arquivo (fileType):
- **pdf** — relatórios, documentos PDF
- **image** — imagens, designs, banners, stories
- **video** — vídeos criados ou processados
- **text** — textos, copywriting, roteiros
- **spreadsheet** — planilhas, tabelas de dados
- **code** — scripts, código gerado
- **other** — qualquer outro tipo

### Quando salvar:
- Após criar um relatório e enviá-lo no chat → salve com fileType "pdf" ou "text"
- Após gerar uma imagem ou design → salve com fileType "image" + URL da imagem
- Após escrever um roteiro ou copy → salve com fileType "text"
- Após exportar dados para planilha → salve com fileType "spreadsheet"

**REGRA**: Se você criou algo para um cliente ou usuário, SEMPRE salve na biblioteca antes de encerrar a tarefa.

## Design System Starkën — use SEMPRE em artefatos visuais

Você tem acesso ao Design System oficial da Starkën. Consulte o catálogo antes de criar qualquer HTML/relatório/email/proposta.

### Descobrir componentes disponíveis (use WebFetch):
\`\`\`
GET {DESKRPG_API_BASE}/api/storybook/components
\`\`\`

Filtros: \`?category=componentes\`, \`?category=fundamentos\`, \`?search=botao\`, \`?tag=cta\`.

### Guia completo (markdown, use WebFetch):
\`\`\`
GET {DESKRPG_API_BASE}/api/storybook/guide
\`\`\`

### Gerar HTML pronto por template (use WebFetch):
\`\`\`
GET {DESKRPG_API_BASE}/api/storybook/html-template?type=<tipo>&cliente=<nome>&format=json
\`\`\`

**Templates:**
- \`relatorio-mensal\` — relatório de performance (KPIs + tabela)
- \`email-onboarding\` — email de boas-vindas
- \`proposta-comercial\` — proposta comercial
- \`alerta-monitoramento\` — card de alerta (severity: success/warning/danger)

**Exemplo — João gerando relatório:**
\`\`\`
GET /api/storybook/html-template?type=relatorio-mensal&cliente=Fenix%20Performance&periodo=Abril%202026&format=json
\`\`\`
→ resposta contém \`html\` pronto. Preencha os dados e salve em \`/api/internal/npc-output\`.

### Tokens obrigatórios (NUNCA hardcode hex):
- Cores: \`var(--brand-primary)\`, \`var(--brand-secondary)\`, \`var(--neutral-900..100)\`, \`var(--success)\`, \`var(--warning)\`, \`var(--danger)\`
- Tipografia: \`var(--font-display)\`, \`var(--font-body)\`, \`var(--font-mono)\`
- Espaçamento: múltiplos de 4px via \`var(--spacing-1..24)\`

### Referência visual completa (abra no navegador):
\`{DESKRPG_API_BASE}/storybook/index.html\`

**REGRA DE OURO**: Artefato visual sem consultar o Design System = artefato fora do padrão Starkën. SEMPRE consulte antes.
`.trim();
}

function detectRole(npcName: string): string {
  const lower = npcName.toLowerCase();
  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return role;
    }
  }
  return "reporting"; // fallback padrão
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ errorCode: "unauthorized", error: "Unauthorized" }, { status: 401 });
  }

  const [npc] = await db.select().from(npcs).where(eq(npcs.id, id));
  if (!npc) {
    return NextResponse.json({ errorCode: "npc_not_found", error: "NPC not found" }, { status: 404 });
  }

  const [channel] = await db.select().from(channels).where(eq(channels.id, npc.channelId));
  if (!channel || channel.ownerId !== userId) {
    return NextResponse.json({ errorCode: "forbidden", error: "Only channel owner can configure NPCs" }, { status: 403 });
  }

  let body: Record<string, string> = {};
  try { body = await req.json(); } catch { /* optional body */ }

  const role = detectRole(npc.name);
  const fenixRoot = process.env.FENIX_LAB_ROOT || path.resolve(process.cwd(), "..");
  const workspaceDataRoot = path.join(fenixRoot, "workspace-data");
  const agentMemoryRoot = process.env.NPC_MEMORY_FILE_ROOT || path.join(fenixRoot, "agent-memory");
  fs.mkdirSync(workspaceDataRoot, { recursive: true });
  fs.mkdirSync(agentMemoryRoot, { recursive: true });

  // Build MCP list. Supabase is intentionally not injected by default.
  const mcps: McpServerEntry[] = ROLE_MCP_CONFIGS[role] || ROLE_MCP_CONFIGS.reporting;

  const allowedTools = ROLE_TOOLS[role] || ROLE_TOOLS.reporting;

  // 1. Update powers in DB
  const oc = parseDbObject(npc.openclawConfig) || {};
  const existingPowers = (oc.powers as Record<string, unknown> | null) || {};
  const existingSandboxPaths = Array.isArray(existingPowers.sandboxPaths)
    ? existingPowers.sandboxPaths.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];
  const sandboxPaths = Array.from(new Set([
    ...existingSandboxPaths,
    fenixRoot,
    path.join(fenixRoot, "escritorio"),
    agentMemoryRoot,
    workspaceDataRoot,
    path.join(fenixRoot, "storybook"),
  ]));
  const existingEnvVars = existingPowers.envVars && typeof existingPowers.envVars === "object" && !Array.isArray(existingPowers.envVars)
    ? existingPowers.envVars as Record<string, string>
    : {};
  const newPowers = {
    ...existingPowers,
    allowedTools,
    mcpServers: mcps,
    sandboxPaths,
    envVars: {
      ...existingEnvVars,
      FENIX_LAB_ROOT: fenixRoot,
      FENIX_WORKSPACE_DATA_ROOT: workspaceDataRoot,
      NPC_MEMORY_FILE_ROOT: agentMemoryRoot,
      DESKRPG_MEMORY_PROVIDER: "vps",
    },
    maxTurns: typeof existingPowers.maxTurns === "number" ? existingPowers.maxTurns : 30,
    timeoutMs: typeof existingPowers.timeoutMs === "number" ? existingPowers.timeoutMs : 180000,
  };

  const updatedOc = { ...oc, powers: newPowers };
  await db.update(npcs).set({ openclawConfig: jsonForDb(updatedOc) }).where(eq(npcs.id, id));

  // 2. Update IDENTITY.md on gateway agent (if agent exists)
  const agentId = oc.agentId as string | undefined;
  const runtimeProvider = typeof oc.runtimeProvider === "string" ? oc.runtimeProvider : undefined;
  const runtimeModel = typeof oc.model === "string" ? oc.model : undefined;
  let identityUpdated = false;

  if (agentId) {
    try {
      // Read current IDENTITY.md
      let identityContent = "";
      try {
        const current = await internalRpc(npc.channelId, "agents.files.get", {
          agentId,
          name: "IDENTITY.md",
          runtimeProvider,
          runtimeModel,
        });
        identityContent = (current as { content?: string })?.content || "";
      } catch { /* file may not exist */ }

      // Remove old tools section if it exists, then append new one
      const toolsSectionMarker = "## Ferramentas disponíveis (use SEM pedir permissão)";
      if (identityContent.includes(toolsSectionMarker)) {
        identityContent = identityContent.split(toolsSectionMarker)[0].trimEnd();
      }

      const toolsSection = buildToolsIdentitySection(role, mcps);
      const updatedIdentity = `${identityContent}\n\n${toolsSection}`.trim();

      await internalRpc(npc.channelId, "agents.files.set", {
        agentId,
        name: "IDENTITY.md",
        content: updatedIdentity,
        runtimeProvider,
        runtimeModel,
      });
      identityUpdated = true;
    } catch (err) {
      console.warn("[setup-role] Failed to update IDENTITY.md:", err);
    }
  }

  return NextResponse.json({
    ok: true,
    role,
    mcpsConfigured: mcps.length,
    toolsConfigured: allowedTools.length,
    identityUpdated,
    agentId: agentId || null,
    message: agentId
      ? `Configurado: ${mcps.length} MCPs, ${allowedTools.length} tools, IDENTITY.md atualizado`
      : `MCPs salvos. IDENTITY.md não atualizado — NPC ainda não tem agente vinculado.`,
  });
}
