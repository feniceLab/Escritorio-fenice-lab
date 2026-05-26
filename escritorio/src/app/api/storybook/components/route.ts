import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

/**
 * GET /api/storybook/components
 *
 * Retorna o catálogo de componentes/fundamentos do Design System Starkën
 * em formato consumível por NPCs (via WebFetch) e humanos.
 *
 * Fonte: /public/storybook/index.json (gerado pelo `storybook build`)
 *        + /storybook/stories/**\/*.stories.js (metadados extras via leitura)
 *
 * Query params:
 *   ?category=componentes|fundamentos|padroes|introducao   — filtra por categoria
 *   ?tag=button,cta                                         — filtra por tags
 *   ?search=termo                                           — busca no título/descrição
 *
 * Response:
 * {
 *   designSystem: "Starkën Design System",
 *   version: "2.0.0",
 *   total: 11,
 *   components: [
 *     {
 *       id: "...",
 *       title: "...",
 *       category: "Componentes" | "Fundamentos" | "Padrões" | "Introdução",
 *       name: "Botões",
 *       description: "...",
 *       url: "/storybook/index.html?path=/docs/...",
 *       iframeUrl: "/storybook/iframe.html?id=...&viewMode=docs",
 *       importPath: "./stories/componentes/Botoes.stories.js",
 *       tags: [...]
 *     }
 *   ]
 * }
 */

interface SbEntry {
  id: string;
  title: string;
  name: string;
  importPath: string;
  type: "docs" | "story";
  tags?: string[];
  storiesImports?: string[];
}

interface SbIndex {
  v: number;
  entries: Record<string, SbEntry>;
}

function categoryFromTitle(title: string): string {
  const parts = title.split("/");
  if (parts.length >= 2) return parts[1] || "Outros";
  return "Outros";
}

function nameFromTitle(title: string): string {
  const parts = title.split("/");
  return parts[parts.length - 1] || title;
}

export async function GET(req: NextRequest) {
  const indexPath = path.join(process.cwd(), "public", "storybook", "index.json");

  let sbIndex: SbIndex;
  try {
    const raw = await fs.readFile(indexPath, "utf-8");
    sbIndex = JSON.parse(raw);
  } catch (err) {
    return NextResponse.json(
      {
        errorCode: "storybook_not_built",
        error: "Storybook static build not found. Run `cd storybook && npm run build-storybook` first.",
        detail: String(err),
      },
      { status: 503 },
    );
  }

  const entries = Object.values(sbIndex.entries || {});
  const category = req.nextUrl.searchParams.get("category")?.toLowerCase();
  const tagFilter = req.nextUrl.searchParams.get("tag")?.toLowerCase().split(",").filter(Boolean) || [];
  const search = req.nextUrl.searchParams.get("search")?.toLowerCase();

  let components = entries.map((e) => {
    const cat = categoryFromTitle(e.title);
    const name = nameFromTitle(e.title);
    return {
      id: e.id,
      title: e.title,
      category: cat,
      name,
      type: e.type,
      importPath: e.importPath,
      tags: e.tags || [],
      url: `/storybook/index.html?path=/docs/${e.id}`,
      iframeUrl: `/storybook/iframe.html?id=${e.id}&viewMode=docs`,
    };
  });

  if (category) {
    components = components.filter((c) => c.category.toLowerCase().includes(category));
  }

  if (tagFilter.length > 0) {
    components = components.filter((c) =>
      c.tags.some((t) => tagFilter.includes(t.toLowerCase())),
    );
  }

  if (search) {
    components = components.filter(
      (c) =>
        c.title.toLowerCase().includes(search) ||
        c.name.toLowerCase().includes(search),
    );
  }

  // Grouped summary for easier NPC consumption
  const byCategory = components.reduce(
    (acc, c) => {
      if (!acc[c.category]) acc[c.category] = [];
      acc[c.category].push({ id: c.id, name: c.name, url: c.url });
      return acc;
    },
    {} as Record<string, { id: string; name: string; url: string }[]>,
  );

  return NextResponse.json({
    designSystem: "Starkën Design System",
    version: "2.0.0",
    total: components.length,
    byCategory,
    components,
    usage: {
      description:
        "Use este catálogo para descobrir componentes do Design System. Cada componente tem um 'iframeUrl' que você pode embutir ou screenshot via Chrome MCP. Para gerar HTML pronto, use /api/storybook/html-template?id=<componentId>.",
      tokens: {
        colors:
          "Use SEMPRE variáveis CSS: var(--brand-primary), var(--brand-secondary), var(--neutral-100), var(--success), var(--warning), var(--danger). Nunca hardcode hex.",
        typography:
          "Fontes definidas em --font-display, --font-body, --font-mono. Tamanhos: --text-xs até --text-4xl.",
        spacing:
          "Use múltiplos de 4px via --spacing-1 (4px) até --spacing-24 (96px).",
      },
    },
  });
}
