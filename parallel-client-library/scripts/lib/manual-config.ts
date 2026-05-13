export interface LibraryCollectionDefinition {
  key: string;
  title: string;
  description: string;
  sortOrder: number;
}

export interface RequiredSlotDefinition {
  slotKey: string;
  title: string;
  collectionKey: string;
  slotType: "logo" | "document" | "asset" | "guideline" | "landing-page";
  instructions: string;
}

export const DEFAULT_COLLECTIONS: LibraryCollectionDefinition[] = [
  {
    key: "design-system",
    title: "Design System",
    description: "Identidade, logos, cores, tipografia e materiais estruturais do cliente.",
    sortOrder: 0,
  },
  {
    key: "documents",
    title: "Documentos",
    description: "Briefings, PRDs, brand book, links e documentação consolidada.",
    sortOrder: 1,
  },
  {
    key: "stories",
    title: "Stories",
    description: "Stories históricos, recorrentes e referências de story do cliente.",
    sortOrder: 2,
  },
  {
    key: "feed",
    title: "Feed",
    description: "Posts unitários de feed e criativos estáticos já produzidos.",
    sortOrder: 3,
  },
  {
    key: "carousels",
    title: "Carrosséis",
    description: "Carrosséis históricos e estruturas reutilizáveis do cliente.",
    sortOrder: 4,
  },
  {
    key: "videos",
    title: "Vídeos",
    description: "Reels, vídeos e referências audiovisuais do cliente.",
    sortOrder: 5,
  },
  {
    key: "landing-pages",
    title: "Landing Pages",
    description: "Blocos, páginas, relatórios e estruturas relacionadas a LP.",
    sortOrder: 6,
  },
  {
    key: "references",
    title: "Referências",
    description: "Links, relatórios, visões macro e referências externas do cliente.",
    sortOrder: 7,
  },
  {
    key: "assets",
    title: "Assets",
    description: "Arquivos, materiais e documentos reais já existentes do cliente.",
    sortOrder: 8,
  },
];

export const REQUIRED_SLOTS: RequiredSlotDefinition[] = [
  {
    slotKey: "logo-primary",
    title: "Logo principal",
    collectionKey: "design-system",
    slotType: "logo",
    instructions: "Subir manualmente o logo principal oficial do cliente.",
  },
  {
    slotKey: "logo-light",
    title: "Logo branca/clara",
    collectionKey: "design-system",
    slotType: "logo",
    instructions: "Subir manualmente a versão clara da marca.",
  },
  {
    slotKey: "logo-dark",
    title: "Logo escura",
    collectionKey: "design-system",
    slotType: "logo",
    instructions: "Subir manualmente a versão escura da marca.",
  },
  {
    slotKey: "logo-avatar",
    title: "Avatar / favicon",
    collectionKey: "design-system",
    slotType: "logo",
    instructions: "Subir manualmente a versão reduzida para avatar e favicon.",
  },
  {
    slotKey: "brand-book",
    title: "Brand Book",
    collectionKey: "documents",
    slotType: "document",
    instructions: "Anexar o brand book oficial quando estiver disponível.",
  },
  {
    slotKey: "briefing",
    title: "Briefing",
    collectionKey: "documents",
    slotType: "document",
    instructions: "Anexar o briefing oficial do cliente.",
  },
  {
    slotKey: "prd",
    title: "PRD",
    collectionKey: "documents",
    slotType: "document",
    instructions: "Anexar o PRD validado do cliente.",
  },
  {
    slotKey: "prd-design",
    title: "PRD de design",
    collectionKey: "documents",
    slotType: "document",
    instructions: "Anexar o PRD de design validado do cliente.",
  },
  {
    slotKey: "tone-of-voice",
    title: "Tom de voz",
    collectionKey: "documents",
    slotType: "guideline",
    instructions: "Anexar documento definitivo de tom de voz do cliente.",
  },
  {
    slotKey: "landing-blueprint",
    title: "Blueprint de landing page",
    collectionKey: "landing-pages",
    slotType: "landing-page",
    instructions: "Anexar estrutura base aprovada para LP do cliente.",
  },
];

export const MANUAL_ALIASES: Record<string, string[]> = {
  "mortadella-blumenau": ["Mortadella", "Mortadella Blumenau"],
  "aseyori-restaurante": ["Aseyori", "Aseyori Restaurante"],
  "academia-sao-pedro": ["Academia São Pedro", "Academia Sao Pedro"],
  "melhor-visao": ["Melhor Visão", "Melhor Visao"],
  "jpr-moveis-rusticos": ["Jpr Rústicos", "JPR Moveis Rusticos", "JPR Móveis Rústicos"],
  "fratellis-pizzaria": ["Fratelli's", "Fratelli", "Fratellis Pizzaria"],
  "saporito-pizzaria": ["Saporito", "Saporito Pizzaria"],
  "worldburguer": ["World Burger", "WorldBurguer"],
  "d-britos": ["D Britos", "D Britos Petiscos", "D' Britos"],
  "super-x-guaratuba": ["Super X", "Super X - Guaratuba"],
  "super-x-garuva": ["Super X", "Super X - Garuva"],
  "super-x-itapoa": ["Super X", "Super X - Itapoá", "Super X - Itapoa"],
  "pizzaria-super-x": ["Super X", "Pizzaria Super X"],
  "madrugao-centro": ["Madrugão 3 Lojas", "Madrugao 3 Lojas", "Madrugao - Centro"],
  "madrugao-garcia": ["Madrugão 3 Lojas", "Madrugao 3 Lojas", "Madrugao - Garcia"],
  "madrugao-fortaleza": ["Madrugão 3 Lojas", "Madrugao 3 Lojas", "Madrugao - Fortaleza"],
  "new-service": ["New Service Indus. Química", "New Service Indus. Quimica", "New Service"],
  "mestre-do-frango": ["Mestre do Frango", "Mestre do Frango Passo Fundo"],
  "patricia-salgados": ["Patrícia Salgados", "Patricia Salgados"],
};

export const LOCAL_ARTIFACT_PATTERNS = [
  "relatorio",
  "visao_macro",
  "visao-macro",
  "report",
];
