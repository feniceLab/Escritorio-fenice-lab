import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import {
  channelMembers,
  channels,
  db,
  isPostgres,
  jsonForDb,
} from "@/db";
import { parseDbJson } from "@/lib/db-json";
import { getClientLibrarySeed } from "@/lib/client-library-defaults";
import { buildImportedLibrarySeed } from "@/lib/client-library-import";
import {
  CLIENT_LIBRARY_MANIFEST,
  type ClientLibraryManifestEntry,
} from "@/lib/client-library-manifest";
import type { LibrarySeedItem } from "@/lib/fenix-library-defaults";
import { seedChannelLibrary } from "@/lib/library-seeding";
import { generateChannelInviteCode } from "@/lib/security-policy";

interface HqBootstrapContext {
  id: string;
  ownerId: string;
  groupId: string | null;
  mapData: unknown;
  mapConfig: unknown;
}

export interface BootstrappedClientLibrary {
  clientName: string;
  tenant: string;
  channelId: string;
  channelCreated: boolean;
  itemsAttempted: number;
  itemsCreated: number;
  sourceMode: ClientLibraryManifestEntry["source"]["mode"];
  sourceQuality: ClientLibraryManifestEntry["source"]["quality"];
}

export interface BootstrapClientLibrariesResult {
  totalClients: number;
  channelsCreated: number;
  itemsAttempted: number;
  itemsCreated: number;
  clients: BootstrappedClientLibrary[];
}

function buildSourceSummary(entry: ClientLibraryManifestEntry) {
  return [
    `# Fonte da biblioteca — ${entry.clientName}`,
    "",
    `- Tenant: ${entry.tenant}`,
    `- Segmento: ${entry.segment}`,
    `- Responsável: ${entry.responsible}`,
    `- Família de marca: ${entry.brandFamily}`,
    `- Tipo de origem: ${entry.source.mode}`,
    `- Qualidade: ${entry.source.quality}`,
    `- Fonte principal: ${entry.source.sourceLabel}`,
    entry.source.sharedBrandKey ? `- Marca compartilhada: ${entry.source.sharedBrandKey}` : null,
    "",
    "## Cobertura de ativos",
    `- Website: ${entry.source.assetCoverage.website ? "sim" : "não"}`,
    `- Drive: ${entry.source.assetCoverage.drive ? "sim" : "não"}`,
    `- Aprovação: ${entry.source.assetCoverage.approval ? "sim" : "não"}`,
    `- Logo: ${entry.source.assetCoverage.logo ? "sim" : "não"}`,
    `- Social: ${entry.source.assetCoverage.social ? "sim" : "não"}`,
    entry.source.notes ? "" : null,
    entry.source.notes ? "## Observações" : null,
    entry.source.notes ?? null,
    entry.source.repoArtifacts.length > 0 ? "" : null,
    entry.source.repoArtifacts.length > 0 ? "## Artefatos locais encontrados" : null,
    ...entry.source.repoArtifacts.map((artifact) => `- ${artifact}`),
  ].filter(Boolean).join("\n");
}

function buildGapChecklist(entry: ClientLibraryManifestEntry) {
  const gaps =
    entry.source.gaps.length > 0
      ? entry.source.gaps.map((gap) => `- ${gap}`)
      : ["- Nenhuma lacuna crítica mapeada para esta biblioteca."];

  return [
    `# Checklist de completude — ${entry.clientName}`,
    "",
    "## Estrutura mínima esperada",
    "- logos e variações",
    "- paleta oficial",
    "- tipografia oficial",
    "- briefing",
    "- PRD",
    "- PRD de design",
    "- brand book",
    "- diretrizes de marca",
    "- kit de conteúdo",
    "- blueprint de landing page",
    "",
    "## Lacunas atuais",
    ...gaps,
  ].join("\n");
}

function buildManifestLibrarySeed(entry: ClientLibraryManifestEntry): LibrarySeedItem[] {
  const baseSeed = getClientLibrarySeed({
    clientName: entry.clientName,
    businessType: entry.businessType,
  });
  const importedSeed = buildImportedLibrarySeed(entry);

  const manifestDocs: LibrarySeedItem[] = [
    {
      layer: "documents",
      group: "docs",
      category: "source-map",
      name: `Fonte da biblioteca — ${entry.clientName}`,
      content: buildSourceSummary(entry),
      metadata: {
        source: "client-manifest",
        sourceMode: entry.source.mode,
        sourceQuality: entry.source.quality,
        tenant: entry.tenant,
        brandFamily: entry.brandFamily,
      },
    },
    {
      layer: "documents",
      group: "docs",
      category: "completion-checklist",
      name: `Checklist de completude — ${entry.clientName}`,
      content: buildGapChecklist(entry),
      metadata: {
        source: "client-manifest",
        sourceMode: entry.source.mode,
        sourceQuality: entry.source.quality,
        tenant: entry.tenant,
        brandFamily: entry.brandFamily,
      },
    },
  ];

  return [...baseSeed, ...manifestDocs, ...importedSeed];
}

async function ensureOwnerMembership(channelId: string, ownerId: string) {
  const existing = await db
    .select({ id: channelMembers.id })
    .from(channelMembers)
    .where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, ownerId)))
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(channelMembers).values({
    channelId,
    userId: ownerId,
    role: "owner",
  });
}

export async function bootstrapClientLibrariesForHq(
  hqChannel: HqBootstrapContext,
): Promise<BootstrapClientLibrariesResult> {
  const normalizedMapData = parseDbJson(hqChannel.mapData) ?? hqChannel.mapData;
  const normalizedMapConfig = parseDbJson(hqChannel.mapConfig) ?? hqChannel.mapConfig;

  const existingClientChannels = await db
    .select({
      id: channels.id,
      name: channels.name,
      clientName: channels.clientName,
    })
    .from(channels)
    .where(
      hqChannel.groupId
        ? and(eq(channels.groupId, hqChannel.groupId), eq(channels.channelType, "client"))
        : and(eq(channels.parentChannelId, hqChannel.id), eq(channels.channelType, "client")),
    );

  const existingByName = new Map(
    existingClientChannels.map((channel) => [
      (channel.clientName?.trim() || channel.name).toLowerCase(),
      channel,
    ]),
  );

  const clients: BootstrappedClientLibrary[] = [];
  let channelsCreated = 0;
  let itemsAttempted = 0;
  let itemsCreated = 0;

  for (const entry of CLIENT_LIBRARY_MANIFEST) {
    const existing = existingByName.get(entry.clientName.toLowerCase());
    let channelId = existing?.id ?? null;
    let channelCreated = false;

    if (!channelId) {
      const now = isPostgres ? new Date() : new Date().toISOString();
      const [createdChannel] = await db
        .insert(channels)
        .values({
          name: entry.clientName,
          description: `Biblioteca operacional e design system do cliente ${entry.clientName}.`,
          ownerId: hqChannel.ownerId,
          groupId: hqChannel.groupId,
          mapData: jsonForDb(normalizedMapData),
          mapConfig: jsonForDb(normalizedMapConfig),
          isPublic: true,
          inviteCode: generateChannelInviteCode(),
          maxPlayers: 50,
          gatewayConfig: jsonForDb({ libraryToken: randomUUID() }),
          channelType: "client",
          clientName: entry.clientName,
          clientLogo: null,
          parentChannelId: hqChannel.id,
          createdAt: now as unknown as Date,
          updatedAt: now as unknown as Date,
        })
        .returning({ id: channels.id });

      channelId = createdChannel.id;
      existingByName.set(entry.clientName.toLowerCase(), {
        id: createdChannel.id,
        name: entry.clientName,
        clientName: entry.clientName,
      });
      channelsCreated += 1;
      channelCreated = true;
      await ensureOwnerMembership(channelId, hqChannel.ownerId);
    } else {
      await ensureOwnerMembership(channelId, hqChannel.ownerId);
    }

    const seed = buildManifestLibrarySeed(entry);
    const seeded = await seedChannelLibrary(channelId, seed);

    itemsAttempted += seeded.attempted;
    itemsCreated += seeded.created;

    clients.push({
      clientName: entry.clientName,
      tenant: entry.tenant,
      channelId,
      channelCreated,
      itemsAttempted: seeded.attempted,
      itemsCreated: seeded.created,
      sourceMode: entry.source.mode,
      sourceQuality: entry.source.quality,
    });
  }

  return {
    totalClients: CLIENT_LIBRARY_MANIFEST.length,
    channelsCreated,
    itemsAttempted,
    itemsCreated,
    clients,
  };
}
