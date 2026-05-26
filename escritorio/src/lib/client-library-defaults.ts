import type { LibrarySeedItem } from "@/lib/fenix-library-defaults";

export type ClientBusinessType = "restaurant" | "pizzaria" | "cafe" | "generic";

interface ClientLibrarySeedInput {
  clientName: string;
  businessType?: ClientBusinessType | null;
  squads?: string[];
}

const BUSINESS_LABELS: Record<ClientBusinessType, string> = {
  restaurant: "Restaurante",
  pizzaria: "Pizzaria",
  cafe: "Cafeteria",
  generic: "Negócio",
};

const BUSINESS_PALETTE: Record<ClientBusinessType, { primary: string; secondary: string }> = {
  restaurant: { primary: "#ea580c", secondary: "#f59e0b" },
  pizzaria: { primary: "#dc2626", secondary: "#f97316" },
  cafe: { primary: "#8b5e3c", secondary: "#d4a373" },
  generic: { primary: "#2563eb", secondary: "#0ea5e9" },
};

function sanitizeClientName(name: string) {
  return name.trim() || "Novo Cliente";
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "NC";
}

function createSvgLogoDataUrl({
  clientName,
  background,
  foreground,
  ring,
  round = false,
}: {
  clientName: string;
  background: string;
  foreground: string;
  ring: string;
  round?: boolean;
}) {
  const initials = getInitials(clientName);
  const safeName = clientName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const svg = round
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
        <rect width="512" height="512" rx="256" fill="${background}" />
        <circle cx="256" cy="256" r="198" fill="none" stroke="${ring}" stroke-width="12" />
        <text x="256" y="228" text-anchor="middle" fill="${foreground}" font-family="Inter, Arial, sans-serif" font-size="126" font-weight="800">${initials}</text>
        <text x="256" y="310" text-anchor="middle" fill="${foreground}" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="600">${safeName}</text>
      </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
        <rect width="960" height="540" rx="36" fill="${background}" />
        <circle cx="176" cy="270" r="88" fill="none" stroke="${ring}" stroke-width="12" />
        <text x="176" y="296" text-anchor="middle" fill="${foreground}" font-family="Inter, Arial, sans-serif" font-size="94" font-weight="800">${initials}</text>
        <text x="324" y="250" fill="${foreground}" font-family="Inter, Arial, sans-serif" font-size="76" font-weight="800">${safeName}</text>
        <text x="324" y="322" fill="${foreground}" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="500">Biblioteca base do cliente</text>
      </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createPrimaryButtonHtml(clientName: string, primary: string, secondary: string) {
  return `
    <button style="
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:8px;
      padding:12px 20px;
      border:none;
      border-radius:12px;
      font-family:Inter, sans-serif;
      font-size:14px;
      font-weight:700;
      color:#ffffff;
      background:linear-gradient(135deg, ${primary}, ${secondary});
      box-shadow:0 10px 30px color-mix(in srgb, ${primary} 35%, transparent);
    ">
      Solicitar proposta de ${clientName}
    </button>
  `.trim();
}

function createCardHtml(clientName: string, primary: string) {
  return `
    <div style="
      width:260px;
      border-radius:20px;
      border:1px solid rgba(255,255,255,0.08);
      background:#0f172a;
      color:#ffffff;
      padding:20px;
      font-family:Inter, sans-serif;
    ">
      <div style="
        width:42px;
        height:42px;
        border-radius:12px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:${primary};
        font-size:18px;
        margin-bottom:16px;
      ">★</div>
      <div style="font-size:20px;font-weight:800;line-height:1.1;margin-bottom:8px;">Oferta em destaque</div>
      <div style="font-size:13px;line-height:1.6;color:#cbd5e1;">
        Estrutura inicial para comunicar o principal benefício de ${clientName} em cards, LPs e anúncios.
      </div>
    </div>
  `.trim();
}

function createHeroHtml(clientName: string, businessLabel: string, primary: string, secondary: string) {
  return `
    <section style="
      border-radius:24px;
      padding:32px;
      background:linear-gradient(135deg, #020617 0%, #0f172a 100%);
      border:1px solid rgba(255,255,255,0.08);
      color:#ffffff;
      font-family:Inter, sans-serif;
    ">
      <div style="
        display:inline-flex;
        padding:6px 12px;
        border-radius:999px;
        background:rgba(255,255,255,0.06);
        color:${secondary};
        font-size:11px;
        font-weight:700;
        letter-spacing:0.08em;
        text-transform:uppercase;
      ">${businessLabel}</div>
      <h1 style="
        margin:18px 0 12px;
        font-family:Sora, Inter, sans-serif;
        font-size:42px;
        line-height:1.05;
        letter-spacing:-0.04em;
      ">Estrutura inicial de landing page para ${clientName}</h1>
      <p style="
        margin:0 0 24px;
        max-width:640px;
        color:#cbd5e1;
        font-size:16px;
        line-height:1.7;
      ">
        Use este bloco como base para páginas de captura, vendas ou apresentação institucional. Ajuste a proposta, a prova social e os CTAs com a voz real do cliente.
      </p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <button style="border:none;border-radius:12px;padding:12px 20px;background:${primary};color:#fff;font-weight:700;">CTA Principal</button>
        <button style="border:1px solid rgba(255,255,255,0.16);border-radius:12px;padding:12px 20px;background:transparent;color:#fff;font-weight:600;">CTA Secundário</button>
      </div>
    </section>
  `.trim();
}

export function getClientLibrarySeed(input: ClientLibrarySeedInput): LibrarySeedItem[] {
  const clientName = sanitizeClientName(input.clientName);
  const businessType = input.businessType ?? "generic";
  const businessLabel = BUSINESS_LABELS[businessType];
  const palette = BUSINESS_PALETTE[businessType];
  const squads = Array.isArray(input.squads) ? input.squads : [];
  const squadList = squads.length > 0 ? squads.join(", ") : "brand-scraper, designer, landing-page, social";

  return [
    {
      layer: "design",
      group: "logos",
      category: "logo-dark",
      name: `Logo base — ${clientName}`,
      content: createSvgLogoDataUrl({
        clientName,
        background: "#020617",
        foreground: "#ffffff",
        ring: palette.primary,
      }),
      metadata: {
        source: "client-base",
        usage: "Placeholder inicial para apresentações internas enquanto o logo oficial do cliente não é consolidado.",
        businessType,
        placeholder: true,
      },
    },
    {
      layer: "design",
      group: "logos",
      category: "logo-light",
      name: `Logo clara — ${clientName}`,
      content: createSvgLogoDataUrl({
        clientName,
        background: "#f8fafc",
        foreground: "#0f172a",
        ring: palette.secondary,
      }),
      metadata: {
        source: "client-base",
        usage: "Versão clara de placeholder para contextos com fundos brancos e materiais de aprovação.",
        businessType,
        placeholder: true,
      },
    },
    {
      layer: "design",
      group: "logos",
      category: "logo-round",
      name: `Avatar base — ${clientName}`,
      content: createSvgLogoDataUrl({
        clientName,
        background: "#020617",
        foreground: "#ffffff",
        ring: palette.primary,
        round: true,
      }),
      metadata: {
        source: "client-base",
        usage: "Avatar provisório para biblioteca, miniaturas, favicon e social enquanto o ícone final não é definido.",
        businessType,
        badge: "CLIENTE",
        placeholder: true,
      },
    },
    {
      layer: "design",
      group: "tokens",
      category: "color-primary",
      name: `Cor primária base — ${clientName}`,
      content: "Cor provisória para protótipos e primeiras peças. Trocar assim que a marca oficial do cliente estiver fechada.",
      metadata: {
        source: "client-base",
        cssValue: palette.primary,
        token: "var(--client-primary)",
        usage: "CTA principal, destaques e hierarquia visual do cliente.",
        businessType,
        placeholder: true,
      },
    },
    {
      layer: "design",
      group: "tokens",
      category: "color-secondary",
      name: `Cor secundária base — ${clientName}`,
      content: "Cor de apoio para gradientes, elementos decorativos e variações de destaque.",
      metadata: {
        source: "client-base",
        cssValue: palette.secondary,
        token: "var(--client-secondary)",
        usage: "Apoio visual, variações de blocos e acentos de interface.",
        businessType,
        placeholder: true,
      },
    },
    {
      layer: "design",
      group: "typography",
      category: "font-display",
      name: `Fonte de títulos — ${clientName}`,
      content: "Sora é a sugestão inicial para títulos até a tipografia oficial do cliente ser definida.",
      metadata: {
        source: "client-base",
        token: "var(--client-font-display)",
        fontFamily: "Sora",
        fontWeight: "400-800",
        usage: "Títulos, hero sections, ofertas e chamadas principais.",
        placeholder: true,
      },
    },
    {
      layer: "design",
      group: "typography",
      category: "font-body",
      name: `Fonte de corpo — ${clientName}`,
      content: "Inter é a base segura para interface, LPs e materiais operacionais até a família oficial ser definida.",
      metadata: {
        source: "client-base",
        token: "var(--client-font-body)",
        fontFamily: "Inter",
        fontWeight: "400-700",
        usage: "Corpo de texto, interfaces, formulários e legendas.",
        placeholder: true,
      },
    },
    {
      layer: "design",
      group: "components",
      category: "button-primary",
      name: `Botão principal — ${clientName}`,
      content: createPrimaryButtonHtml(clientName, palette.primary, palette.secondary),
      metadata: {
        source: "client-base",
        componentType: "button",
        usage: "CTA base para landing pages, formulários, WhatsApp e campanhas.",
        placeholder: true,
      },
    },
    {
      layer: "design",
      group: "components",
      category: "card-default",
      name: `Card de oferta — ${clientName}`,
      content: createCardHtml(clientName, palette.primary),
      metadata: {
        source: "client-base",
        componentType: "card",
        usage: "Card inicial para destacar produto, serviço, benefício ou prova social.",
        placeholder: true,
      },
    },
    {
      layer: "design",
      group: "components",
      category: "header-template",
      name: `Hero LP — ${clientName}`,
      content: createHeroHtml(clientName, businessLabel, palette.primary, palette.secondary),
      metadata: {
        source: "client-base",
        componentType: "hero",
        usage: "Bloco inicial para landing pages, páginas de vendas e institucionais.",
        placeholder: true,
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "briefing",
      name: `Briefing inicial — ${clientName}`,
      content: `# Briefing inicial — ${clientName}

## Tipo de negócio
- ${businessLabel}

## Squads previstos
- ${squadList}

## O que falta consolidar
- proposta principal de valor
- público-alvo prioritário
- diferenciais competitivos
- ofertas e ticket
- canais principais de aquisição

## Próximas ações recomendadas
1. Rodar o agente de Brand Intelligence para coletar sinais reais.
2. Consolidar logo, paleta, tipografia e voz do cliente.
3. Ajustar esta biblioteca antes de produzir campanhas, LPs e assets.
`,
      metadata: {
        source: "client-base",
        audience: "agents",
        businessType,
        placeholder: true,
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "prd",
      name: `PRD base — ${clientName}`,
      content: `# PRD base — ${clientName}

## Objetivo do cliente
- definir objetivo principal do canal
- definir meta de negócio
- definir meta de marketing

## Entregas prioritárias
- conteúdo orgânico
- campanhas pagas
- landing pages
- ativos de vendas

## Indicadores de sucesso
- leads
- agendamentos
- vendas
- retenção
- recorrência

## Dependências
- logo validado
- paleta validada
- proposta clara
- acesso aos canais principais
`,
      metadata: {
        source: "client-base",
        audience: "strategy",
        placeholder: true,
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "design-prd",
      name: `PRD de design — ${clientName}`,
      content: `# PRD de design — ${clientName}

## O que a biblioteca precisa cobrir
- logos e variações
- paleta oficial
- tipografia principal e secundária
- direção de foto e vídeo
- templates de carrossel, stories e reels
- blocos de landing page

## Saídas visuais esperadas
- peças para social media
- anúncios
- landing pages
- propostas
- materiais institucionais

## Critério de pronto
- a equipe consegue criar peças sem improvisar identidade
- os agentes conseguem gerar conteúdo sem depender de briefing manual toda vez
`,
      metadata: {
        source: "client-base",
        audience: "design",
        placeholder: true,
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "brand-book",
      name: `Brand Book base — ${clientName}`,
      content: `# Brand Book base — ${clientName}

## Identidade visual
- Logo oficial: pendente validar
- Versões do logo: pendente validar
- Paleta final: substituir tokens provisórios
- Tipografia final: substituir fontes base se necessário

## Direção visual sugerida
- usar os itens da biblioteca como ponto de partida
- evitar peças genéricas
- adaptar textura, fotografia e tom ao setor ${businessLabel.toLowerCase()}

## Regra operacional
Tudo que virar padrão aprovado deve ser salvo novamente nesta biblioteca.
`,
      metadata: {
        source: "client-base",
        audience: "agents",
        placeholder: true,
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "asset-inventory",
      name: `Inventário de assets — ${clientName}`,
      content: `# Inventário de assets — ${clientName}

## Subir aqui
- logo oficial
- variações do logo
- fotos institucionais
- fotos de produto
- vídeos brutos
- links de Canva
- links de Drive
- referências aprovadas

## Regras
- salvar URL, contexto de uso e status
- quando um asset virar padrão, manter nesta biblioteca
`,
      metadata: {
        source: "client-base",
        audience: "operations",
        placeholder: true,
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "brand-guidelines",
      name: `Diretrizes de marca — ${clientName}`,
      content: `# Diretrizes de marca — ${clientName}

## Ordem de consulta
1. Biblioteca do cliente
2. Base Starkën
3. Storybook somente como fallback

## Regras
- todo material deve parecer do cliente, não da Starkën
- a Base Starkën entra como estrutura, não como identidade final
- se uma nova peça virar padrão, ela volta para esta biblioteca
`,
      metadata: {
        source: "client-base",
        audience: "agents",
        placeholder: true,
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "storybook",
      name: `Guia de design system — ${clientName}`,
      content: `# Guia de design system — ${clientName}

## Regra de uso
1. usar primeiro esta biblioteca do cliente
2. usar a Base Starkën para estrutura e padrões operacionais
3. consultar o Storybook apenas como apoio quando faltar componente ou referência

## O que manter atualizado
- componentes aprovados
- padrões de hero, CTA, card e seção
- modelos de carrossel, vídeo e LP
`,
      metadata: {
        source: "client-base",
        audience: "design-system",
        placeholder: true,
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "tone-of-voice",
      name: `Tom de voz — ${clientName}`,
      content: `# Tom de voz — ${clientName}

## Modelo inicial
- claro
- confiável
- objetivo
- próximo do público

## O que personalizar
- nível de formalidade
- vocabulário técnico ou popular
- ritmo de CTA
- promessa principal
- gatilhos permitidos e proibidos
`,
      metadata: {
        source: "client-base",
        audience: "copy",
        placeholder: true,
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "target-audience",
      name: `Público-alvo — ${clientName}`,
      content: `# Público-alvo — ${clientName}

## Hipótese inicial
- público principal: definir
- dores prioritárias: definir
- objeções comuns: definir
- transformação prometida: definir

## Uso pelos agentes
Antes de criar anúncios, vídeos, LPs ou copies, completar esta seção com dados reais do cliente.
`,
      metadata: {
        source: "client-base",
        audience: "strategy",
        placeholder: true,
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "pricing",
      name: `Ofertas e preços — ${clientName}`,
      content: `# Ofertas e preços — ${clientName}

## Checklist
- produto/serviço principal
- produto/serviço de entrada
- ticket médio
- upsell
- prova de valor
- CTA recomendado
`,
      metadata: {
        source: "client-base",
        audience: "sales",
        placeholder: true,
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "faq",
      name: `FAQ comercial — ${clientName}`,
      content: `# FAQ comercial — ${clientName}

Liste aqui as dúvidas recorrentes que aparecem em:
- direct
- WhatsApp
- atendimento
- reunião comercial
- página de vendas
`,
      metadata: {
        source: "client-base",
        audience: "support",
        placeholder: true,
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "testimonials",
      name: `Provas sociais — ${clientName}`,
      content: `# Provas sociais — ${clientName}

## Guardar aqui
- depoimentos curtos
- prints de resultado
- cases
- números de impacto
- antes e depois
`,
      metadata: {
        source: "client-base",
        audience: "growth",
        placeholder: true,
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "copy-templates",
      name: `Templates de copy — ${clientName}`,
      content: `# Templates de copy — ${clientName}

## Estruturas sugeridas
- dor → solução → prova → CTA
- oferta → bônus → urgência → CTA
- objeção → quebra → benefício → CTA

## Regra
Adaptar para a voz do cliente antes de publicar.
`,
      metadata: {
        source: "client-base",
        audience: "copy",
        placeholder: true,
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "content-calendar",
      name: `Calendário editorial base — ${clientName}`,
      content: `# Calendário editorial base — ${clientName}

## Pilares sugeridos
- autoridade
- prova social
- bastidores
- oferta
- objeções
- conteúdo util

## Frequência
Definir conforme operação do cliente e squad responsável.
`,
      metadata: {
        source: "client-base",
        audience: "social",
        placeholder: true,
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "landing-page-blueprint",
      name: `Blueprint de landing page — ${clientName}`,
      content: `# Blueprint de landing page — ${clientName}

## Estrutura recomendada
1. Hero com promessa clara
2. Dor ou oportunidade principal
3. Benefícios
4. Prova social
5. Oferta
6. FAQ
7. CTA final

## Uso
Comece pelos componentes desta biblioteca e complemente com a Base Starkën quando precisar de estrutura ou padrão visual.
`,
      metadata: {
        source: "client-base",
        audience: "landing-page",
        placeholder: true,
      },
    },
  ];
}
