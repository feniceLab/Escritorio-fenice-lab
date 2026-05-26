import { NextResponse } from "next/server";

/**
 * GET /api/storybook/guide
 *
 * Retorna guia em markdown que ensina NPCs a usar o Design System Starkën.
 * Consumido via WebFetch. Pode ser incorporado em IDENTITY.md.
 *
 * ?format=json → retorna o markdown dentro de um JSON.
 */

const GUIDE = `# Design System Starkën — Guia para NPCs

Você tem acesso ao Design System oficial da Starkën. **Use SEMPRE** ao criar artefatos visuais (relatórios, emails, propostas, dashboards).

## 🔍 Descobrir componentes disponíveis

\`\`\`
GET {DESKRPG_API_BASE}/api/storybook/components
\`\`\`

Retorna lista de componentes agrupados por categoria (Fundamentos, Componentes, Padrões, Introdução) com URL da documentação completa.

### Filtros úteis:
- \`?category=componentes\` — só componentes interativos
- \`?category=fundamentos\` — só cores/tipografia/espaçamento
- \`?search=botao\` — busca por nome
- \`?tag=cta\` — filtra por tag

## 🎨 Gerar HTML pronto (relatórios, emails, propostas)

\`\`\`
GET {DESKRPG_API_BASE}/api/storybook/html-template?type=<tipo>&cliente=<nome>
\`\`\`

### Templates disponíveis:
- **\`relatorio-mensal\`** — Relatório de performance mensal com KPIs + tabela
- **\`email-onboarding\`** — Email de boas-vindas para cliente novo
- **\`proposta-comercial\`** — Proposta comercial com escopo + preço
- **\`alerta-monitoramento\`** — Card de alerta (severity: success/warning/danger)

### Exemplo — João gerando relatório:
\`\`\`
GET /api/storybook/html-template?type=relatorio-mensal&cliente=Fenix%20Performance&periodo=Abril%202026&format=json
\`\`\`

Resposta:
\`\`\`json
{ "type": "relatorio-mensal", "html": "<html>...</html>", "length": 4521 }
\`\`\`

## 📐 Tokens visuais (use SEMPRE variáveis CSS)

### Cores (nunca hardcode hex):
- \`var(--brand-primary)\` — verde Starkën (#10b981)
- \`var(--brand-secondary)\` — azul (#0ea5e9)
- \`var(--neutral-900)\` → \`var(--neutral-100)\` — escala de cinzas
- \`var(--success)\` / \`var(--warning)\` / \`var(--danger)\`

### Tipografia:
- \`var(--font-display)\` — títulos
- \`var(--font-body)\` — corpo de texto
- \`var(--font-mono)\` — código/dados técnicos

### Espaçamento (múltiplos de 4px):
- \`var(--spacing-1)\` (4px) → \`var(--spacing-24)\` (96px)

## 🔒 Regras obrigatórias

1. **NUNCA** use cores hardcoded (ex: \`color: #10b981\`). Use variáveis CSS.
2. **SEMPRE** consulte \`/api/storybook/components\` antes de criar HTML do zero.
3. **SEMPRE** salve o artefato final em \`/api/internal/npc-output\` com o HTML no campo \`content\`.
4. Para PDFs: primeiro gere o HTML com template, depois converta (via ferramenta externa) e salve URL.

## 💼 Casos de uso por papel

| NPC | Workflow típico |
|-----|-----------------|
| **João** (Relatórios) | \`html-template?type=relatorio-mensal\` → preenche dados do Supabase → salva em \`npc-output\` |
| **Isis** (Onboarding) | \`html-template?type=email-onboarding\` → personaliza → envia via Gmail |
| **Josy** (Integrações) | Usa \`/components?category=componentes\` → gera templates reutilizáveis |
| **Zezin** (Monitoramento) | \`html-template?type=alerta-monitoramento&severity=danger\` → publica no chat |
| **Lurdinha** (CoS) | Combina múltiplos templates em relatórios executivos |
| **Gael** (CEO) | Revisa artefatos; exige consistência com Design System |

## 🔗 Referência visual completa

Abra no navegador (ou embute em iframe):
\`\`\`
{DESKRPG_API_BASE}/storybook/index.html
\`\`\`
`;

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("format") === "json") {
    return NextResponse.json({
      designSystem: "Starkën Design System",
      version: "2.0.0",
      guide: GUIDE,
    });
  }
  return new NextResponse(GUIDE, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
