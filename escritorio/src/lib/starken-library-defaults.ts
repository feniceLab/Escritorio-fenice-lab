export interface LibrarySeedItem {
  layer: "design" | "documents";
  category: string;
  name: string;
  content?: string | null;
  metadata?: Record<string, unknown> | null;
  assetPath?: string;
  group: "logos" | "tokens" | "typography" | "components" | "docs";
}

const PRIMARY_BUTTON_HTML = `
  <button style="
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    padding:12px 20px;
    border:none;
    border-radius:10px;
    font-family:Inter, sans-serif;
    font-size:14px;
    font-weight:700;
    color:#ffffff;
    background:linear-gradient(135deg,#10b981,#0d9488);
    box-shadow:0 4px 20px rgba(16,185,129,0.25);
  ">
    Começar agora
  </button>
`.trim();

const KPI_CARD_HTML = `
  <div style="
    width:240px;
    background:#0f172a;
    border:1px solid rgba(255,255,255,0.08);
    border-radius:16px;
    padding:20px;
    color:#ffffff;
    font-family:Inter, sans-serif;
  ">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
      <div style="
        width:40px;
        height:40px;
        border-radius:10px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:rgba(16,185,129,0.12);
        font-size:18px;
      ">📈</div>
      <span style="
        background:rgba(16,185,129,0.12);
        color:#10b981;
        border:1px solid rgba(16,185,129,0.24);
        border-radius:999px;
        padding:4px 8px;
        font-size:11px;
        font-weight:700;
      ">+12%</span>
    </div>
    <div style="font-size:34px;font-weight:800;letter-spacing:-0.03em;line-height:1;margin-bottom:6px;">142</div>
    <div style="font-size:13px;color:#94a3b8;">Cronogramas enviados</div>
  </div>
`.trim();

const STATUS_BADGE_HTML = `
  <span style="
    display:inline-flex;
    align-items:center;
    gap:6px;
    padding:4px 10px;
    border-radius:999px;
    border:1px solid rgba(16,185,129,0.3);
    background:rgba(16,185,129,0.12);
    color:#10b981;
    font-family:Inter, sans-serif;
    font-size:11px;
    font-weight:700;
    letter-spacing:0.04em;
  ">
    <span style="width:6px;height:6px;border-radius:999px;background:#10b981;display:inline-block;"></span>
    PUBLISHED
  </span>
`.trim();

const INPUT_FIELD_HTML = `
  <div style="width:100%;max-width:280px;font-family:Inter, sans-serif;">
    <label style="
      display:block;
      margin-bottom:8px;
      color:#94a3b8;
      font-size:12px;
      font-weight:600;
      text-transform:uppercase;
      letter-spacing:0.08em;
    ">Nome do cliente</label>
    <input
      value="Fenix Performance"
      style="
        width:100%;
        padding:10px 14px;
        border-radius:10px;
        border:1px solid rgba(16,185,129,0.32);
        background:#0f172a;
        color:#ffffff;
        font-size:14px;
        box-shadow:0 0 0 3px rgba(16,185,129,0.12);
      "
    />
  </div>
`.trim();

export function getFenixLibrarySeed(channelName: string): LibrarySeedItem[] {
  const normalizedChannelName = channelName?.trim() || "Canal Starkën";

  return [
    {
      layer: "design",
      group: "logos",
      category: "logo-dark",
      name: "Logo principal Starkën",
      assetPath: "/logo-starken-tecnologia.png",
      metadata: {
        source: "starken-base",
        usage: "Versão principal para materiais institucionais e interfaces em fundo escuro.",
      },
    },
    {
      layer: "design",
      group: "logos",
      category: "logo-light",
      name: "Logo branca Starkën",
      assetPath: "/logo-starken-tecnologia-white.png",
      metadata: {
        source: "starken-base",
        usage: "Versão de alto contraste para hero sections, overlays e fundos coloridos.",
      },
    },
    {
      layer: "design",
      group: "logos",
      category: "logo-transparent",
      name: "Logo transparente Starkën",
      assetPath: "/logo-starken-tecnologia.png",
      metadata: {
        source: "starken-base",
        usage: "Use quando precisar aplicar o logo sobre fundos variados sem moldura.",
      },
    },
    {
      layer: "design",
      group: "logos",
      category: "logo-round",
      name: "Logo circular Starkën",
      assetPath: "/logo-starken-tecnologia-square.png",
      metadata: {
        source: "starken-base",
        usage: "Avatar, favicon, miniatura, perfil e identificadores compactos.",
        badge: "CIRCULAR",
      },
    },
    {
      layer: "design",
      group: "logos",
      category: "logo-alt",
      name: "Logo Branca Alternativa",
      assetPath: "/storybook/logo-starken-dgCD7lDT.png",
      metadata: {
        source: "starken-base",
        usage: "Nova variação de marca em composição circular para aplicações institucionais e destaque visual.",
      },
    },
    {
      layer: "design",
      group: "logos",
      category: "logo-favicon",
      name: "Favicon Oficial",
      assetPath: "/storybook/favicon-circular.png",
      metadata: {
        source: "starken-base",
        usage: "Ícone oficial para aba do navegador, atalhos, PWA e identificadores mínimos do ecossistema Starkën.",
        badge: "FAVICON OFICIAL",
      },
    },
    {
      layer: "design",
      group: "tokens",
      category: "color-primary",
      name: "Brand Primary",
      content: "Verde principal usado em CTAs, highlights, estados positivos e assinatura visual da Starkën.",
      metadata: {
        source: "starken-base",
        cssValue: "#10b981",
        token: "var(--brand-primary)",
        usage: "CTAs, highlights, links estratégicos e gráficos positivos.",
      },
    },
    {
      layer: "design",
      group: "tokens",
      category: "color-secondary",
      name: "Brand Secondary",
      content: "Teal de apoio para gradientes, superfícies ativas e variações da cor principal.",
      metadata: {
        source: "starken-base",
        cssValue: "#0d9488",
        token: "var(--brand-secondary)",
        usage: "Gradientes, hover states e blocos de apoio.",
      },
    },
    {
      layer: "design",
      group: "tokens",
      category: "color-surface",
      name: "Surface",
      content: "Superfície base para cards, painéis e containers do produto.",
      metadata: {
        source: "starken-base",
        cssValue: "#0f172a",
        token: "var(--bg-surface)",
        usage: "Cards, painéis, modais e áreas de leitura.",
      },
    },
    {
      layer: "design",
      group: "tokens",
      category: "color-text-primary",
      name: "Text Primary",
      content: "Texto principal para títulos, rótulos fortes e informação prioritária.",
      metadata: {
        source: "starken-base",
        cssValue: "#ffffff",
        token: "var(--text-primary)",
        usage: "Headings, labels de destaque e números principais.",
      },
    },
    {
      layer: "design",
      group: "tokens",
      category: "color-text-secondary",
      name: "Text Secondary",
      content: "Cor de corpo de texto e descrições de apoio.",
      metadata: {
        source: "starken-base",
        cssValue: "#94a3b8",
        token: "var(--text-secondary)",
        usage: "Parágrafos, descrições, legendas e explicações.",
      },
    },
    {
      layer: "design",
      group: "tokens",
      category: "color-success",
      name: "Success",
      content: "Estado positivo e feedback de confirmação.",
      metadata: {
        source: "starken-base",
        cssValue: "#10b981",
        token: "var(--success)",
        usage: "Sucesso, confirmação, publicação concluída.",
      },
    },
    {
      layer: "design",
      group: "tokens",
      category: "color-warning",
      name: "Warning",
      content: "Estado de atenção e fila de processamento.",
      metadata: {
        source: "starken-base",
        cssValue: "#f59e0b",
        token: "var(--warning)",
        usage: "Alertas, filas, pendências e estados intermediários.",
      },
    },
    {
      layer: "design",
      group: "tokens",
      category: "color-danger",
      name: "Danger",
      content: "Estado crítico, falhas e ações destrutivas.",
      metadata: {
        source: "starken-base",
        cssValue: "#ef4444",
        token: "var(--danger)",
        usage: "Erros, bloqueios, remoções e status falhos.",
      },
    },
    {
      layer: "design",
      group: "typography",
      category: "font-body",
      name: "Inter",
      content: "Fonte principal de corpo. Use em interface, formulários, textos corridos, labels e botões.",
      metadata: {
        source: "starken-base",
        token: "var(--font-body)",
        fontFamily: "Inter",
        fontWeight: "400-900",
        usage: "Corpo, UI, labels, inputs e botões.",
      },
    },
    {
      layer: "design",
      group: "typography",
      category: "font-display",
      name: "Sora",
      content: "Fonte de display para headings e blocos hero. Deve concentrar títulos fortes e institucionais.",
      metadata: {
        source: "starken-base",
        token: "var(--font-display)",
        fontFamily: "Sora",
        fontWeight: "400-800",
        usage: "Títulos, hero sections, headlines e relatórios executivos.",
      },
    },
    {
      layer: "design",
      group: "typography",
      category: "font-mono",
      name: "Fira Code",
      content: "Fonte monoespaçada para código, IDs, variáveis CSS, datas técnicas e blocos de diagnóstico.",
      metadata: {
        source: "starken-base",
        token: "var(--font-mono)",
        fontFamily: "Fira Code",
        fontWeight: "400-600",
        usage: "Código, tokens, valores técnicos e dados estruturados.",
      },
    },
    {
      layer: "design",
      group: "components",
      category: "button-primary",
      name: "Botão primário",
      content: PRIMARY_BUTTON_HTML,
      metadata: {
        source: "starken-base",
        componentType: "button",
        token: "var(--brand-primary)",
        usage: "Ação principal por contexto. Use com parcimônia.",
      },
    },
    {
      layer: "design",
      group: "components",
      category: "card-default",
      name: "Card KPI",
      content: KPI_CARD_HTML,
      metadata: {
        source: "starken-base",
        componentType: "card",
        usage: "Métricas de topo, cards de dashboard e resumos executivos.",
      },
    },
    {
      layer: "design",
      group: "components",
      category: "badge-template",
      name: "Badge de status",
      content: STATUS_BADGE_HTML,
      metadata: {
        source: "starken-base",
        componentType: "badge",
        usage: "Status operacionais como PUBLISHED, QUEUED, FAILED e afins.",
      },
    },
    {
      layer: "design",
      group: "components",
      category: "input-template",
      name: "Campo de formulário",
      content: INPUT_FIELD_HTML,
      metadata: {
        source: "starken-base",
        componentType: "input",
        usage: "Formulários, filtros, configuradores e painéis administrativos.",
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "brand-book",
      name: "Brand Book Starkën",
      content: `# Brand Book Starkën

## Essência
- Marca: Starkën Tecnologia
- Posicionamento: tecnologia aplicada à operação, dados e marketing digital
- Sensação desejada: confiança, precisão, inteligência operacional e sofisticação prática

## Logos oficiais
- Logo principal: uso institucional e de produto
- Logo branca: fundos escuros, heros e overlays
- Logo circular: favicon, avatar, miniatura, perfil e ícones quadrados

## Paleta central
- var(--brand-primary) = #10b981
- var(--brand-secondary) = #0d9488
- var(--bg-surface) = #0f172a
- var(--text-primary) = #ffffff
- var(--text-secondary) = #94a3b8

## Tipografia
- var(--font-display): Sora para títulos
- var(--font-body): Inter para interface e corpo
- var(--font-mono): Fira Code para dados técnicos

## Regras de ouro
1. Nunca usar hex hardcoded se houver token equivalente.
2. Preferir fundo escuro com contraste alto.
3. Botão primário com gradiente verde é reservado à ação principal.
4. Toda peça visual deve parecer produto Starkën, não template genérico.
`,
      metadata: {
        source: "starken-base",
        audience: "agents",
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "brand-guidelines",
      name: "Diretrizes rápidas para agentes",
      content: `# Diretrizes rápidas para agentes

## Prioridade de consulta
1. Consulte primeiro esta Biblioteca do canal.
2. Só abra o Storybook quando faltar um componente, um padrão ou quando o usuário pedir detalhe extra.

## Regras obrigatórias
- Use tokens visuais da Starkën.
- Não improvise nova paleta se a biblioteca já trouxer a decisão.
- Se criar artefato novo, salve de volta na biblioteca.
- Mantenha consistência entre relatórios, e-mails, cards e dashboards.

## Quando usar o Storybook
- Para aprofundar um componente específico
- Para validar uma documentação de padrão
- Para buscar HTML-base oficial quando a biblioteca local ainda não tiver esse item
`,
      metadata: {
        source: "starken-base",
        audience: "agents",
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "design-pillars",
      name: "Pilares do Design Starkën",
      content: `# Pilares do Design Starkën

## Cyber-SaaS
- aparência tecnológica e sofisticada
- superfícies escuras, contraste alto e brilho controlado
- sensação de sistema premium, nunca template genérico

## Premium
- layouts com respiro, hierarquia clara e acabamento refinado
- microdecisões visuais devem transmitir valor e confiança

## Alta Performance
- informação principal sempre evidente
- componentes precisam ser rápidos de entender e operar
- densidade visual com clareza, não poluição

## Acessível
- contraste forte
- tipografia legível
- estados e hierarquia perceptíveis sem esforço

## Consistente
- repetir padrões aprovados
- evitar reinventar variações quando já houver base na biblioteca
- Storybook entra como apoio, não como primeira fonte
`,
      metadata: {
        source: "starken-base",
        audience: "agents",
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "storybook",
      name: "Guia de consulta ao Storybook",
      content: `# Guia de consulta ao Storybook

## URLs úteis
- Visual completo: /storybook/index.html
- Catálogo para agentes: /api/storybook/components
- Guia em markdown: /api/storybook/guide?format=json

## Como usar
- Comece pela Biblioteca do canal.
- Se o item não estiver aqui, consulte /api/storybook/components.
- Se precisar de referência visual aprofundada, abra o Storybook.
- Sempre que um item do Storybook virar padrão recorrente, traga esse item para a Biblioteca do canal.
`,
      metadata: {
        source: "starken-base",
        audience: "agents",
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "briefing",
      name: `Briefing base — ${normalizedChannelName}`,
      content: `# Briefing base do canal

## Canal
- Nome: ${normalizedChannelName}
- Objetivo desta biblioteca: concentrar os ativos e regras que os agentes devem usar antes de consultar o Storybook

## O que este canal deve guardar
- logos aprovados
- tokens e decisões de marca
- componentes e padrões recorrentes
- documentos orientadores
- referências sociais e criações aprovadas

## Observação operacional
Sempre que um agente descobrir ou consolidar um padrão novo, esse conhecimento deve voltar para a biblioteca do canal.
`,
      metadata: {
        source: "starken-base",
        audience: "agents",
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "prd",
      name: "PRD — Biblioteca operacional dos agentes",
      content: `# PRD — Biblioteca operacional dos agentes

## Problema
A aba Biblioteca existe, mas ainda não entrega contexto suficiente para orientar agentes sem recorrer direto ao Storybook.

## Objetivo
Transformar a biblioteca do canal na fonte operacional principal para marca, assets, documentos e padrões aprovados.

## Resultado esperado
- agentes consultam a biblioteca primeiro
- Storybook vira fallback e aprofundamento
- o canal guarda padrões vivos, não placeholders
`,
      metadata: {
        source: "starken-base",
        audience: "product",
      },
    },
  ];
}
