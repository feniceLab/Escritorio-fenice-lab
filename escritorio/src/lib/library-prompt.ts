import { db, channelLibraryItems, channels } from "@/db";
import { eq } from "drizzle-orm";
import { parseDbJson } from "@/lib/db-json";

const MAX_DOC_PREVIEW = 500;

type LibraryRow = {
  layer: string;
  name: string;
  content: string | null;
  metadata: unknown;
};

function appendDesignAndDocumentsSection(lines: string[], heading: string, rows: LibraryRow[]) {
  const design = rows.filter((row) => row.layer === "design");
  if (design.length > 0) {
    lines.push(`\n### ${heading} — Design System`);
    for (const item of design) {
      const meta = typeof item.metadata === "string" ? parseDbJson(item.metadata) : item.metadata;
      const token = meta && typeof meta === "object" ? (meta as Record<string, unknown>).token : null;
      const usage = meta && typeof meta === "object" ? (meta as Record<string, unknown>).usage : null;
      const cssValue = meta && typeof meta === "object" ? (meta as Record<string, unknown>).cssValue : null;
      const placeholder = meta && typeof meta === "object" ? (meta as Record<string, unknown>).placeholder : null;
      const placeholderNote = placeholder ? " — base inicial do cliente; revisar antes de publicar" : "";
      if (item.content?.startsWith("data:image")) {
        lines.push(`- ${item.name}: [imagem disponivel na biblioteca]${usage ? ` — ${usage}` : ""}${placeholderNote}`);
      } else if (item.content) {
        lines.push(`- ${item.name}${token ? ` (${token})` : ""}: ${item.content.slice(0, 200)}${cssValue ? ` [${cssValue}]` : ""}${usage ? ` — ${usage}` : ""}${placeholderNote}`);
      } else {
        lines.push(`- ${item.name}${token ? ` (${token})` : ""}: (vazio)${usage ? ` — ${usage}` : ""}${placeholderNote}`);
      }
    }
  }

  const documents = rows.filter((row) => row.layer === "documents");
  if (documents.length > 0) {
    lines.push(`\n### ${heading} — Documentos`);
    for (const item of documents) {
      const meta = typeof item.metadata === "string" ? parseDbJson(item.metadata) : item.metadata;
      const placeholder = meta && typeof meta === "object" ? (meta as Record<string, unknown>).placeholder : null;
      const preview = item.content
        ? item.content.slice(0, MAX_DOC_PREVIEW) + (item.content.length > MAX_DOC_PREVIEW ? "..." : "")
        : "(vazio)";
      lines.push(`\n#### ${item.name}${placeholder ? " [base inicial]" : ""}\n${preview}`);
    }
  }
}

function appendOperationalSection(lines: string[], rows: LibraryRow[]) {
  const social = rows.filter((row) => row.layer === "social");
  if (social.length > 0) {
    lines.push("\n### Conteudo Social (Stories & Feed)");
    lines.push(`- ${social.length} itens na biblioteca (stories, posts, reels)`);
  }

  const creations = rows.filter((row) => row.layer === "creations");
  const pending = creations.filter((row) => (row.metadata as Record<string, unknown>)?.status === "pending");
  const approved = creations.filter((row) => (row.metadata as Record<string, unknown>)?.status === "approved");
  if (creations.length > 0) {
    lines.push("\n### Criacoes dos Agentes");
    lines.push(`- ${pending.length} pendentes de aprovacao, ${approved.length} aprovados`);
  }

  const apis = rows.filter((row) => row.layer === "api");
  if (apis.length > 0) {
    lines.push("\n### APIs Configuradas");
    for (const item of apis) {
      lines.push(`- ${item.name}: [configurado como variavel de ambiente]`);
    }
  }
}

/**
 * Build a compact library context section to inject into NPC system prompts.
 * Returns empty string if the channel has no relevant library items.
 */
export async function buildLibraryPromptSection(channelId: string): Promise<string> {
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
      .where(eq(channels.id, channelId))
      .limit(1);

    const currentRows = await db
      .select()
      .from(channelLibraryItems)
      .where(eq(channelLibraryItems.channelId, channelId))
      .orderBy(channelLibraryItems.layer, channelLibraryItems.sortOrder);

    let parentRows: typeof currentRows = [];
    let parentTitle: string | null = null;

    if (channel?.channelType === "client" && channel.parentChannelId) {
      const [parentChannel] = await db
        .select({
          id: channels.id,
          name: channels.name,
          clientName: channels.clientName,
        })
        .from(channels)
        .where(eq(channels.id, channel.parentChannelId))
        .limit(1);

      if (parentChannel) {
        parentTitle = parentChannel.clientName?.trim() || parentChannel.name || "Starkën";
        parentRows = await db
          .select()
          .from(channelLibraryItems)
          .where(eq(channelLibraryItems.channelId, parentChannel.id))
          .orderBy(channelLibraryItems.layer, channelLibraryItems.sortOrder);
      }
    }

    if (currentRows.length === 0 && parentRows.length === 0) {
      return "";
    }

    const title = channel?.clientName || channel?.name || "Cliente";
    const lines: string[] = [];

    if (channel?.channelType === "client" && parentRows.length > 0) {
      lines.push(`\n## Biblioteca ativa neste canal: ${title}\n`);
      lines.push("Ao produzir para este cliente, use primeiro a biblioteca do cliente para identidade, linguagem e referências específicas. Use a Base Starkën como apoio estrutural para componentes, consistência visual, landing pages e padrões operacionais.");
      appendDesignAndDocumentsSection(lines, `Base Starkën — ${parentTitle}`, parentRows as LibraryRow[]);

      if (currentRows.length > 0) {
        appendDesignAndDocumentsSection(lines, `Biblioteca do Cliente — ${title}`, currentRows as LibraryRow[]);
        appendOperationalSection(lines, currentRows as LibraryRow[]);
      }
    } else {
      lines.push(`\n## Biblioteca do Canal: ${title}\n`);
      lines.push("Use esta biblioteca como fonte primaria do canal. Consulte o Storybook apenas se um componente/padrao nao estiver aqui ou se o usuario pedir profundidade extra.");
      appendDesignAndDocumentsSection(lines, title, currentRows as LibraryRow[]);
      appendOperationalSection(lines, currentRows as LibraryRow[]);
    }

    // Instructions for agents to save to library
    lines.push(`\n## INSTRUCOES DE ESCRITA NA BIBLIOTECA (OBRIGATORIO)`);
    lines.push(`Voce tem permissao de escrita. Use WebFetch para salvar itens.`);
    lines.push(`\nURL: \${DESKRPG_API_BASE}/api/channels/\${DESKRPG_CHANNEL_ID}/library`);
    lines.push(`Method: POST`);
    lines.push(`Headers: { "Content-Type": "application/json", "X-Library-Token": "\${DESKRPG_LIBRARY_TOKEN}" }`);
    lines.push(`\nAs variaveis DESKRPG_API_BASE, DESKRPG_CHANNEL_ID e DESKRPG_LIBRARY_TOKEN estao disponiveis como variaveis de ambiente.`);
    lines.push(`\n### Exemplos de Body por tipo:`);
    lines.push(`**Logo:** { "layer": "design", "category": "logo-dark", "name": "Logo Fundo Preto", "content": "<base64 da imagem>", "metadata": { "mime": "image/png", "size": 45000 } }`);
    lines.push(`**Cor:** { "layer": "design", "category": "color-primary", "name": "Cor Primaria", "content": "#FF6B35", "metadata": { "cssValue": "#FF6B35" } }`);
    lines.push(`**Fonte:** { "layer": "design", "category": "font-primary", "name": "Fonte Principal", "content": "Inter Bold", "metadata": { "fontFamily": "Inter", "fontWeight": "700" } }`);
    lines.push(`**Componente:** { "layer": "design", "category": "button-primary", "name": "Botao Principal", "content": "<button style='...'>Texto</button>", "metadata": { "componentType": "button", "cssValue": "#FF6B35" } }`);
    lines.push(`**Documento:** { "layer": "documents", "category": "brand-book", "name": "Brand Book", "content": "# Brand Book\\n\\n## Cores\\n..." }`);
    lines.push(`**Post Social:** { "layer": "social", "category": "feed-post", "name": "Post Referencia", "content": "<base64>", "metadata": { "platform": "instagram", "postType": "feed" } }`);
    lines.push(`**Criacao (para aprovacao):** { "layer": "creations", "category": "image", "name": "Post Promo", "content": "<base64>", "metadata": { "status": "pending", "platform": "instagram", "postType": "feed", "caption": "legenda..." } }`);
    lines.push(`**Chave API:** { "layer": "api", "category": "api-key", "name": "META_ADS_TOKEN", "content": "valor_do_token" }`);
    lines.push(`\nRegras de comportamento:`);
    lines.push(`1. Consulte primeiro a biblioteca mais especifica do cliente antes de buscar referencias externas.`);
    lines.push(`2. Use a Base Starkën como camada estrutural quando estiver em um canal de cliente.`);
    lines.push(`3. Use o Storybook apenas como fallback ou aprofundamento especializado.`);
    lines.push(`4. Sempre que um padrao do Storybook passar a ser recorrente, salve uma versao curada dele na biblioteca do canal.`);
    lines.push(`5. SEMPRE salve na biblioteca quando coletar ou criar qualquer asset, documento ou configuracao.`);

    return lines.join("\n");
  } catch (err) {
    console.error("Failed to build library prompt section:", err);
    return "";
  }
}
