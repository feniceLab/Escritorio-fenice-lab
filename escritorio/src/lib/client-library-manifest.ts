import type { ClientBusinessType } from "@/lib/client-library-defaults";

export type ClientTenant = "fenix" | "alpha";
export type ClientLibrarySourceMode = "exact" | "shared-brand" | "placeholder";
export type ClientLibrarySourceQuality = "rich" | "partial" | "seed-only";

export interface ClientLibraryAssetCoverage {
  website: boolean;
  drive: boolean;
  approval: boolean;
  logo: boolean;
  social: boolean;
}

export interface ClientLibrarySourceProfile {
  mode: ClientLibrarySourceMode;
  quality: ClientLibrarySourceQuality;
  sourceLabel: string;
  sourceSlug: string | null;
  sharedBrandKey: string | null;
  assetCoverage: ClientLibraryAssetCoverage;
  repoArtifacts: string[];
  gaps: string[];
  notes?: string;
}

export interface ClientLibraryManifestEntry {
  tenant: ClientTenant;
  clientName: string;
  segment: string;
  responsible: string;
  businessType: ClientBusinessType;
  brandFamily: string;
  source: ClientLibrarySourceProfile;
}

export interface ClientLibraryExtraBrand {
  tenant: ClientTenant;
  brandName: string;
  brandFamily: string;
  source: ClientLibrarySourceProfile;
  suggestedAction: "create-client-channel" | "review-brand-grouping";
}

const NO_ASSETS: ClientLibraryAssetCoverage = {
  website: false,
  drive: false,
  approval: false,
  logo: false,
  social: false,
};

const FULL_ASSETS: ClientLibraryAssetCoverage = {
  website: true,
  drive: true,
  approval: true,
  logo: true,
  social: true,
};

const ASSETS_NO_SOCIAL: ClientLibraryAssetCoverage = {
  website: true,
  drive: true,
  approval: true,
  logo: true,
  social: false,
};

const ASSETS_NO_APPROVAL: ClientLibraryAssetCoverage = {
  website: true,
  drive: true,
  approval: false,
  logo: true,
  social: true,
};

const ASSETS_WEBSITE_DRIVE_LOGO: ClientLibraryAssetCoverage = {
  website: true,
  drive: true,
  approval: false,
  logo: true,
  social: false,
};

const ASSETS_WEBSITE_ONLY: ClientLibraryAssetCoverage = {
  website: true,
  drive: false,
  approval: false,
  logo: false,
  social: false,
};

const ASSETS_WEBSITE_LOGO_ONLY: ClientLibraryAssetCoverage = {
  website: true,
  drive: false,
  approval: false,
  logo: true,
  social: false,
};

const ASSETS_WEBSITE_DRIVE_ONLY: ClientLibraryAssetCoverage = {
  website: true,
  drive: true,
  approval: false,
  logo: false,
  social: false,
};

function slugifyClientName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/['".]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sourceProfile(input: {
  mode: ClientLibrarySourceMode;
  quality: ClientLibrarySourceQuality;
  sourceLabel: string;
  sharedBrandKey?: string;
  assetCoverage?: ClientLibraryAssetCoverage;
  repoArtifacts?: string[];
  gaps?: string[];
  notes?: string;
}): ClientLibrarySourceProfile {
  return {
    mode: input.mode,
    quality: input.quality,
    sourceLabel: input.sourceLabel,
    sourceSlug: input.mode === "placeholder" ? null : slugifyClientName(input.sourceLabel),
    sharedBrandKey: input.sharedBrandKey ?? null,
    assetCoverage: input.assetCoverage ?? NO_ASSETS,
    repoArtifacts: input.repoArtifacts ?? [],
    gaps: input.gaps ?? [],
    notes: input.notes,
  };
}

function clientEntry(input: {
  tenant: ClientTenant;
  clientName: string;
  segment: string;
  responsible: string;
  businessType: ClientBusinessType;
  brandFamily: string;
  source: ClientLibrarySourceProfile;
}): ClientLibraryManifestEntry {
  return input;
}

export const CLIENT_LIBRARY_MANIFEST: ClientLibraryManifestEntry[] = [
  clientEntry({
    tenant: "fenix",
    clientName: "Mortadella Blumenau",
    segment: "Gastronomia",
    responsible: "Juan",
    businessType: "restaurant",
    brandFamily: "mortadella",
    source: sourceProfile({
      mode: "shared-brand",
      quality: "rich",
      sourceLabel: "Mortadella",
      sharedBrandKey: "mortadella",
      assetCoverage: FULL_ASSETS,
      repoArtifacts: ["mortadella-relatorio.html"],
      notes:
        "A operação usa 'Mortadella Blumenau', mas a fonte rica atual está agrupada sob a marca-mãe 'Mortadella'.",
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Hamburgueria Feio",
    segment: "Gastronomia",
    responsible: "Juan",
    businessType: "restaurant",
    brandFamily: "hamburgueria-feio",
    source: sourceProfile({
      mode: "exact",
      quality: "rich",
      sourceLabel: "Hamburgueria Feio",
      assetCoverage: FULL_ASSETS,
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Rosa Mexicano Blumenau",
    segment: "Gastronomia",
    responsible: "Juan",
    businessType: "restaurant",
    brandFamily: "rosa-mexicano",
    source: sourceProfile({
      mode: "exact",
      quality: "rich",
      sourceLabel: "Rosa Mexicano Blumenau",
      assetCoverage: FULL_ASSETS,
      repoArtifacts: ["rosa-blumenau-relatorio.html"],
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Rosa Mexicano Brusque",
    segment: "Gastronomia",
    responsible: "Juan",
    businessType: "restaurant",
    brandFamily: "rosa-mexicano",
    source: sourceProfile({
      mode: "exact",
      quality: "rich",
      sourceLabel: "Rosa Mexicano Brusque",
      assetCoverage: FULL_ASSETS,
      repoArtifacts: ["rosa-brusque-relatorio.html"],
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Suprema Pizza",
    segment: "Gastronomia",
    responsible: "Juan",
    businessType: "pizzaria",
    brandFamily: "suprema-pizza",
    source: sourceProfile({
      mode: "exact",
      quality: "partial",
      sourceLabel: "Suprema Pizza",
      assetCoverage: ASSETS_NO_SOCIAL,
      gaps: ["Conferir links sociais e materiais de conteúdo para completar a camada social."],
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Arena Gourmet",
    segment: "Gastronomia",
    responsible: "Juan",
    businessType: "restaurant",
    brandFamily: "arena-gourmet",
    source: sourceProfile({
      mode: "exact",
      quality: "rich",
      sourceLabel: "Arena Gourmet",
      assetCoverage: FULL_ASSETS,
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Super X - Garuva",
    segment: "Gastronomia",
    responsible: "Juan",
    businessType: "restaurant",
    brandFamily: "super-x",
    source: sourceProfile({
      mode: "shared-brand",
      quality: "rich",
      sourceLabel: "Super X",
      sharedBrandKey: "super-x",
      assetCoverage: FULL_ASSETS,
      notes: "Filial herda a marca principal Super X.",
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Super X - Guaratuba",
    segment: "Gastronomia",
    responsible: "Juan",
    businessType: "restaurant",
    brandFamily: "super-x",
    source: sourceProfile({
      mode: "shared-brand",
      quality: "rich",
      sourceLabel: "Super X",
      sharedBrandKey: "super-x",
      assetCoverage: FULL_ASSETS,
      notes: "Filial herda a marca principal Super X.",
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Super X - Itapoa",
    segment: "Gastronomia",
    responsible: "Juan",
    businessType: "restaurant",
    brandFamily: "super-x",
    source: sourceProfile({
      mode: "shared-brand",
      quality: "partial",
      sourceLabel: "Super X - Itapoá",
      sharedBrandKey: "super-x",
      assetCoverage: ASSETS_WEBSITE_DRIVE_LOGO,
      gaps: ["Adicionar aprovação e links sociais específicos da unidade Itapoá, se existirem."],
      notes: "Existe uma entrada específica para Itapoá, mas ainda parcial.",
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Madrugao - Centro",
    segment: "Gastronomia",
    responsible: "Juan",
    businessType: "restaurant",
    brandFamily: "madrugao",
    source: sourceProfile({
      mode: "shared-brand",
      quality: "rich",
      sourceLabel: "Madrugão 3 Lojas",
      sharedBrandKey: "madrugao",
      assetCoverage: FULL_ASSETS,
      notes: "A marca está agrupada por rede de 3 lojas no import atual.",
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Madrugao - Garcia",
    segment: "Gastronomia",
    responsible: "Juan",
    businessType: "restaurant",
    brandFamily: "madrugao",
    source: sourceProfile({
      mode: "shared-brand",
      quality: "rich",
      sourceLabel: "Madrugão 3 Lojas",
      sharedBrandKey: "madrugao",
      assetCoverage: FULL_ASSETS,
      notes: "A marca está agrupada por rede de 3 lojas no import atual.",
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Madrugao - Fortaleza",
    segment: "Gastronomia",
    responsible: "Juan",
    businessType: "restaurant",
    brandFamily: "madrugao",
    source: sourceProfile({
      mode: "shared-brand",
      quality: "rich",
      sourceLabel: "Madrugão 3 Lojas",
      sharedBrandKey: "madrugao",
      assetCoverage: FULL_ASSETS,
      notes: "A marca está agrupada por rede de 3 lojas no import atual.",
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Restaurante Oca",
    segment: "Gastronomia",
    responsible: "Juan",
    businessType: "restaurant",
    brandFamily: "restaurante-oca",
    source: sourceProfile({
      mode: "exact",
      quality: "rich",
      sourceLabel: "Restaurante Oca",
      assetCoverage: FULL_ASSETS,
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Aseyori Restaurante",
    segment: "Gastronomia",
    responsible: "Juan",
    businessType: "restaurant",
    brandFamily: "aseyori",
    source: sourceProfile({
      mode: "shared-brand",
      quality: "rich",
      sourceLabel: "Aseyori",
      sharedBrandKey: "aseyori",
      assetCoverage: FULL_ASSETS,
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Oklahoma Burger",
    segment: "Gastronomia",
    responsible: "Juan",
    businessType: "restaurant",
    brandFamily: "oklahoma-burger",
    source: sourceProfile({
      mode: "placeholder",
      quality: "seed-only",
      sourceLabel: "Oklahoma Burger",
      gaps: ["Sem fonte rica localizada no repo atual.", "Buscar logo, links e materiais no client_hub ou Drive."],
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Pizzaria Super X",
    segment: "Gastronomia",
    responsible: "Juan",
    businessType: "pizzaria",
    brandFamily: "super-x",
    source: sourceProfile({
      mode: "shared-brand",
      quality: "rich",
      sourceLabel: "Super X",
      sharedBrandKey: "super-x",
      assetCoverage: FULL_ASSETS,
      notes: "Hoje a marca disponível é a principal Super X; a camada de pizzaria pode nascer dela.",
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Sr Salsicha",
    segment: "Gastronomia",
    responsible: "Juan",
    businessType: "restaurant",
    brandFamily: "sr-salsicha",
    source: sourceProfile({
      mode: "placeholder",
      quality: "seed-only",
      sourceLabel: "Sr Salsicha",
      gaps: ["Sem fonte rica localizada no repo atual.", "Preencher branding e referências manualmente."],
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "JPR Moveis Rusticos",
    segment: "Mesas p/ Area de Festas",
    responsible: "Juan",
    businessType: "generic",
    brandFamily: "jpr-rusticos",
    source: sourceProfile({
      mode: "shared-brand",
      quality: "rich",
      sourceLabel: "Jpr Rústicos",
      sharedBrandKey: "jpr-rusticos",
      assetCoverage: FULL_ASSETS,
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Estilo Tulipa",
    segment: "Artigos de Tenis",
    responsible: "Juan",
    businessType: "generic",
    brandFamily: "estilo-tulipa",
    source: sourceProfile({
      mode: "placeholder",
      quality: "seed-only",
      sourceLabel: "Estilo Tulipa",
      gaps: ["Sem fonte rica localizada no repo atual.", "Subir identidade visual e referências de produto."],
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Dommus Smart Home",
    segment: "Automacao Residencial",
    responsible: "Juan",
    businessType: "generic",
    brandFamily: "dommus-smart-home",
    source: sourceProfile({
      mode: "placeholder",
      quality: "seed-only",
      sourceLabel: "Dommus Smart Home",
      gaps: ["Sem fonte rica localizada no repo atual.", "Montar base com branding, LP e biblioteca técnica."],
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Bengers",
    segment: "Eventos",
    responsible: "Juan",
    businessType: "generic",
    brandFamily: "bengers",
    source: sourceProfile({
      mode: "placeholder",
      quality: "seed-only",
      sourceLabel: "Bengers",
      gaps: ["Sem fonte rica localizada no repo atual.", "Recolher logo, provas sociais e material de evento."],
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "The Garrison",
    segment: "Eventos",
    responsible: "Bruna",
    businessType: "generic",
    brandFamily: "the-garrison",
    source: sourceProfile({
      mode: "exact",
      quality: "rich",
      sourceLabel: "The Garrison",
      assetCoverage: FULL_ASSETS,
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "New Service",
    segment: "Industria",
    responsible: "Bruna",
    businessType: "generic",
    brandFamily: "new-service",
    source: sourceProfile({
      mode: "shared-brand",
      quality: "partial",
      sourceLabel: "New Service Indus. Química",
      sharedBrandKey: "new-service",
      assetCoverage: ASSETS_WEBSITE_ONLY,
      gaps: ["Sem logo/drive/aprovação no import atual.", "Precisa de material visual real antes da biblioteca final."],
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Academia Sao Pedro",
    segment: "Academia",
    responsible: "Emilly",
    businessType: "generic",
    brandFamily: "academia-sao-pedro",
    source: sourceProfile({
      mode: "exact",
      quality: "rich",
      sourceLabel: "Academia São Pedro",
      assetCoverage: FULL_ASSETS,
    }),
  }),
  clientEntry({
    tenant: "fenix",
    clientName: "Melhor Visao",
    segment: "Clinica Otica",
    responsible: "Marina",
    businessType: "generic",
    brandFamily: "melhor-visao",
    source: sourceProfile({
      mode: "shared-brand",
      quality: "partial",
      sourceLabel: "Melhor Visão",
      sharedBrandKey: "melhor-visao",
      assetCoverage: ASSETS_WEBSITE_ONLY,
      gaps: ["Import atual tem só website; falta enriquecer com logo, docs e referências visuais."],
    }),
  }),
  clientEntry({
    tenant: "alpha",
    clientName: "Mestre do Frango",
    segment: "Gastronomia",
    responsible: "Bruna",
    businessType: "restaurant",
    brandFamily: "mestre-do-frango",
    source: sourceProfile({
      mode: "exact",
      quality: "partial",
      sourceLabel: "Mestre do Frango",
      assetCoverage: ASSETS_WEBSITE_ONLY,
      repoArtifacts: ["relatorios-detectados.json (Mestre do Frango Passo Fundo)"],
      gaps: ["Trazer logo, Drive e referências sociais para completar a biblioteca."],
    }),
  }),
  clientEntry({
    tenant: "alpha",
    clientName: "Pizzaria do Nei",
    segment: "Gastronomia",
    responsible: "Bruna",
    businessType: "pizzaria",
    brandFamily: "pizzaria-do-nei",
    source: sourceProfile({
      mode: "exact",
      quality: "partial",
      sourceLabel: "Pizzaria do Nei",
      assetCoverage: ASSETS_WEBSITE_DRIVE_LOGO,
      repoArtifacts: ["relatorios-detectados.json"],
      gaps: ["Falta link de aprovação e camada social rica."],
    }),
  }),
  clientEntry({
    tenant: "alpha",
    clientName: "Super Duper",
    segment: "Gastronomia",
    responsible: "Bruna",
    businessType: "restaurant",
    brandFamily: "super-duper",
    source: sourceProfile({
      mode: "exact",
      quality: "partial",
      sourceLabel: "Super Duper",
      assetCoverage: ASSETS_WEBSITE_DRIVE_LOGO,
      gaps: ["Faltam aprovação e sociais estruturados no import atual."],
    }),
  }),
  clientEntry({
    tenant: "alpha",
    clientName: "WorldBurguer",
    segment: "Gastronomia",
    responsible: "Bruna",
    businessType: "restaurant",
    brandFamily: "world-burger",
    source: sourceProfile({
      mode: "shared-brand",
      quality: "partial",
      sourceLabel: "World Burger",
      sharedBrandKey: "world-burger",
      assetCoverage: ASSETS_WEBSITE_DRIVE_LOGO,
      gaps: ["Normalizar o naming entre WorldBurguer e World Burger."],
    }),
  }),
  clientEntry({
    tenant: "alpha",
    clientName: "Saporito Pizzaria",
    segment: "Gastronomia",
    responsible: "Bruna",
    businessType: "pizzaria",
    brandFamily: "saporito",
    source: sourceProfile({
      mode: "shared-brand",
      quality: "partial",
      sourceLabel: "Saporito",
      sharedBrandKey: "saporito",
      assetCoverage: ASSETS_NO_APPROVAL,
      gaps: ["Completar materiais de aprovação do cliente."],
    }),
  }),
  clientEntry({
    tenant: "alpha",
    clientName: "Fratellis Pizzaria",
    segment: "Gastronomia",
    responsible: "Bruna",
    businessType: "pizzaria",
    brandFamily: "fratellis",
    source: sourceProfile({
      mode: "shared-brand",
      quality: "partial",
      sourceLabel: "Fratelli's",
      sharedBrandKey: "fratellis",
      assetCoverage: ASSETS_NO_APPROVAL,
      gaps: ["Completar materiais de aprovação do cliente."],
    }),
  }),
  clientEntry({
    tenant: "alpha",
    clientName: "D' Britos",
    segment: "Gastronomia",
    responsible: "Emilly",
    businessType: "restaurant",
    brandFamily: "d-britos",
    source: sourceProfile({
      mode: "shared-brand",
      quality: "partial",
      sourceLabel: "D Britos Petiscos",
      sharedBrandKey: "d-britos",
      assetCoverage: ASSETS_WEBSITE_DRIVE_ONLY,
      gaps: ["Falta logo estruturado no import atual.", "Completar redes sociais e peças de referência."],
    }),
  }),
  clientEntry({
    tenant: "alpha",
    clientName: "Patricia Salgados",
    segment: "Gastronomia",
    responsible: "Emilly",
    businessType: "restaurant",
    brandFamily: "patricia-salgados",
    source: sourceProfile({
      mode: "shared-brand",
      quality: "partial",
      sourceLabel: "Patrícia Salgados",
      sharedBrandKey: "patricia-salgados",
      assetCoverage: ASSETS_WEBSITE_DRIVE_LOGO,
      repoArtifacts: ["relatorios-detectados.json"],
      gaps: ["Falta aprovação e links sociais no import atual."],
    }),
  }),
  clientEntry({
    tenant: "alpha",
    clientName: "Salfest",
    segment: "Gastronomia",
    responsible: "Emilly",
    businessType: "restaurant",
    brandFamily: "salfest",
    source: sourceProfile({
      mode: "exact",
      quality: "partial",
      sourceLabel: "Salfest",
      assetCoverage: ASSETS_WEBSITE_DRIVE_LOGO,
      gaps: ["Falta aprovação e links sociais no import atual."],
    }),
  }),
  clientEntry({
    tenant: "alpha",
    clientName: "Sorveteria Maciel",
    segment: "Gastronomia",
    responsible: "Juan",
    businessType: "cafe",
    brandFamily: "sorveteria-maciel",
    source: sourceProfile({
      mode: "placeholder",
      quality: "seed-only",
      sourceLabel: "Sorveteria Maciel",
      gaps: ["Sem fonte rica localizada no repo atual.", "Montar base inicial com logo, paleta e blueprint de catálogo/LP."],
    }),
  }),
];

export const CLIENT_LIBRARY_EXTRA_BRANDS: ClientLibraryExtraBrand[] = [
  {
    tenant: "fenix",
    brandName: "Mortadella Tabajara",
    brandFamily: "mortadella",
    source: sourceProfile({
      mode: "exact",
      quality: "rich",
      sourceLabel: "Mortadella Tabajara",
      assetCoverage: FULL_ASSETS,
      notes: "Marca rica disponível no import, mas ainda sem canal operacional correspondente na base de 35 clientes.",
    }),
    suggestedAction: "create-client-channel",
  },
  {
    tenant: "fenix",
    brandName: "Realizzati Móveis",
    brandFamily: "realizzati-moveis",
    source: sourceProfile({
      mode: "exact",
      quality: "rich",
      sourceLabel: "Realizzati Móveis",
      assetCoverage: FULL_ASSETS,
    }),
    suggestedAction: "review-brand-grouping",
  },
  {
    tenant: "alpha",
    brandName: "Churrascaria Paiaguas",
    brandFamily: "churrascaria-paiaguas",
    source: sourceProfile({
      mode: "exact",
      quality: "partial",
      sourceLabel: "Churrascaria Paiaguas",
      assetCoverage: ASSETS_WEBSITE_LOGO_ONLY,
    }),
    suggestedAction: "create-client-channel",
  },
  {
    tenant: "alpha",
    brandName: "Where2go",
    brandFamily: "where2go",
    source: sourceProfile({
      mode: "exact",
      quality: "partial",
      sourceLabel: "Where2go",
      assetCoverage: ASSETS_WEBSITE_ONLY,
    }),
    suggestedAction: "create-client-channel",
  },
];

export const CLIENT_LIBRARY_MANIFEST_SUMMARY = {
  totalClients: CLIENT_LIBRARY_MANIFEST.length,
  byTenant: {
    fenix: CLIENT_LIBRARY_MANIFEST.filter((entry) => entry.tenant === "fenix").length,
    alpha: CLIENT_LIBRARY_MANIFEST.filter((entry) => entry.tenant === "alpha").length,
  },
  bySourceMode: {
    exact: CLIENT_LIBRARY_MANIFEST.filter((entry) => entry.source.mode === "exact").length,
    "shared-brand": CLIENT_LIBRARY_MANIFEST.filter((entry) => entry.source.mode === "shared-brand").length,
    placeholder: CLIENT_LIBRARY_MANIFEST.filter((entry) => entry.source.mode === "placeholder").length,
  },
  byQuality: {
    rich: CLIENT_LIBRARY_MANIFEST.filter((entry) => entry.source.quality === "rich").length,
    partial: CLIENT_LIBRARY_MANIFEST.filter((entry) => entry.source.quality === "partial").length,
    "seed-only": CLIENT_LIBRARY_MANIFEST.filter((entry) => entry.source.quality === "seed-only").length,
  },
  extraBrands: CLIENT_LIBRARY_EXTRA_BRANDS.length,
} as const;

export function getClientLibraryManifestEntry(clientName: string, tenant?: ClientTenant) {
  const normalizedName = clientName.trim().toLowerCase();

  return CLIENT_LIBRARY_MANIFEST.find((entry) => {
    const sameTenant = tenant ? entry.tenant === tenant : true;
    return sameTenant && entry.clientName.trim().toLowerCase() === normalizedName;
  }) ?? null;
}

export function getClientLibraryEntriesByTenant(tenant: ClientTenant) {
  return CLIENT_LIBRARY_MANIFEST.filter((entry) => entry.tenant === tenant);
}

export function getClientsMissingRichLibrarySource() {
  return CLIENT_LIBRARY_MANIFEST.filter((entry) => entry.source.quality === "seed-only");
}
