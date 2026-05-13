import path from "node:path";
import { DEFAULT_COLLECTIONS, MANUAL_ALIASES, REQUIRED_SLOTS } from "./manual-config";
import { inferMediaKind, normalizeKey, parseImageUrlField, uniqueStrings } from "./normalize";
import {
  buildAliasSetForClient,
  buildClientSourceManifest,
  type ClientHubImportRow,
  type ClientSourceManifest,
  type DetectedReportRow,
  type LocalArtifact,
  type OperationalClient,
  type TrelloCardAsset,
} from "./source-files";
import { createSupabaseRestClientFromEnv, type SupabaseRestClient } from "./supabase-rest";

interface RemotePublishHistoryRow {
  id: string;
  client_key?: string | null;
  client_name?: string | null;
  platform?: string | null;
  caption?: string | null;
  image_url?: string | null;
  status?: string | null;
  post_type?: string | null;
  media_type?: string | null;
  created_at?: string | null;
  scheduled_for?: string | null;
  published_at?: string | null;
  user_name?: string | null;
  task_id?: string | null;
}

interface RemoteContentGroupRow {
  id: string;
  client_id?: string | null;
  name?: string | null;
}

interface RemoteContentTaskRow {
  id: string;
  name?: string | null;
  group_id?: string | null;
  status?: string | null;
  due_date?: string | null;
  publish_config?: Record<string, unknown> | null;
  assignee?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface RemoteContentAttachmentRow {
  id: string;
  task_id?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  category?: string | null;
  format_type?: string | null;
  uploaded_by?: string | null;
  created_at?: string | null;
}

interface RemoteClientHubRow {
  id?: string;
  client_slug?: string | null;
  client_name?: string | null;
  tenant?: string | null;
  segment?: string | null;
  responsible?: string | null;
  status?: string | null;
  contract_package?: string | null;
  website_url?: string | null;
  drive_folder_url?: string | null;
  approval_url?: string | null;
  brand_colors?: unknown;
  brand_fonts?: unknown;
  logo_url?: string | null;
  tone_of_voice?: string | null;
  persona_description?: string | null;
  social_links?: Record<string, string> | null;
  notes?: string | null;
  updated_at?: string | null;
}

interface RemoteClientHubMaterialRow {
  id: string;
  client_slug?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  storage_path?: string | null;
  category?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  uploaded_by?: string | null;
  created_at?: string | null;
}

interface RemoteSourceBundle {
  publishHistory: RemotePublishHistoryRow[];
  contentGroups: RemoteContentGroupRow[];
  contentTasks: RemoteContentTaskRow[];
  contentAttachments: RemoteContentAttachmentRow[];
  clientHubRows: RemoteClientHubRow[];
  clientHubMaterials: RemoteClientHubMaterialRow[];
  cursorUpdates: Record<string, string | null>;
}

interface ClientPreparedSources {
  client: OperationalClient;
  aliases: string[];
  importRows: ClientHubImportRow[];
  liveClientHubRows: RemoteClientHubRow[];
  clientHubMaterials: RemoteClientHubMaterialRow[];
  localArtifacts: LocalArtifact[];
  detectedReports: DetectedReportRow[];
  trelloAssets: TrelloCardAsset[];
  publishHistory: RemotePublishHistoryRow[];
  contentAttachments: Array<RemoteContentAttachmentRow & { taskName?: string | null; taskStatus?: string | null }>;
}

interface BackfillStats {
  clientsProcessed: number;
  itemsUpserted: number;
  mediaUpserted: number;
  slotsUpserted: number;
  issuesLogged: number;
}

interface RunOptions {
  rootDir: string;
  clientFilter?: string | null;
  write: boolean;
}

interface SyncOptions extends RunOptions {
  syncType: "backfill" | "incremental";
}

function parseJsonField(value: unknown) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function toSlugCandidates(...values: Array<string | null | undefined>) {
  return uniqueStrings(values).map((value) => normalizeKey(value));
}

function buildAliasIndex(manifest: ClientSourceManifest) {
  const aliasIndex = new Map<string, string>();
  for (const client of manifest.operationalClients) {
    const aliases = buildAliasSetForClient(client.clientSlug, client.clientName, manifest.clientHubImportRows);
    for (const manualAlias of MANUAL_ALIASES[client.clientSlug] ?? []) aliases.push(manualAlias);
    for (const alias of aliases) aliasIndex.set(normalizeKey(alias), client.clientSlug);
    aliasIndex.set(client.clientSlug, client.clientSlug);
  }
  return aliasIndex;
}

function resolveClientSlug(
  aliasIndex: Map<string, string>,
  values: Array<string | null | undefined>,
  options?: { allowPartial?: boolean },
) {
  for (const candidate of toSlugCandidates(...values)) {
    const resolved = aliasIndex.get(candidate);
    if (resolved) return resolved;

    if (options?.allowPartial) {
      const partialMatches = [...aliasIndex.entries()]
        .filter(([alias]) => alias && alias.length >= 8 && (candidate.includes(alias) || alias.includes(candidate)))
        .sort((left, right) => right[0].length - left[0].length);
      if (partialMatches[0]) return partialMatches[0][1];
    }
  }
  return null;
}

function maxTimestamp<T>(rows: T[], picker: (row: T) => string | null | undefined) {
  const timestamps = rows.map(picker).filter(Boolean).sort();
  return timestamps.length ? timestamps[timestamps.length - 1]! : null;
}

async function loadRemoteSources(client: SupabaseRestClient, syncType: "backfill" | "incremental") {
  const syncStateRows =
    syncType === "incremental"
      ? await client.maybeSelectAll<{ sync_key: string; last_cursor: string | null }>("library_sync_state", { select: "sync_key,last_cursor" })
      : [];
  const syncState = new Map(syncStateRows.map((row) => [row.sync_key, row.last_cursor]));

  const publishHistory = await client.maybeSelectAll<RemotePublishHistoryRow>("publish_history", {
    select: "*",
    order: "created_at.asc",
    filters:
      syncType === "incremental" && syncState.get("publish_history")
        ? [`created_at=gt.${syncState.get("publish_history")}`]
        : [],
  });
  const contentGroups = await client.maybeSelectAll<RemoteContentGroupRow>("content_groups", {
    select: "id,client_id,name",
  });
  const contentTasks = await client.maybeSelectAll<RemoteContentTaskRow>("content_tasks", {
    select: "id,name,group_id,status,due_date,publish_config,assignee,created_at,updated_at",
    filters:
      syncType === "incremental" && syncState.get("content_tasks")
        ? [`updated_at=gt.${syncState.get("content_tasks")}`]
        : [],
  });
  const contentAttachments = await client.maybeSelectAll<RemoteContentAttachmentRow>("content_attachments", {
    select: "*",
    filters:
      syncType === "incremental" && syncState.get("content_attachments")
        ? [`created_at=gt.${syncState.get("content_attachments")}`]
        : [],
  });
  const clientHubRows = await client.maybeSelectAll<RemoteClientHubRow>("client_hub", {
    select: "*",
    filters:
      syncType === "incremental" && syncState.get("client_hub")
        ? [`updated_at=gt.${syncState.get("client_hub")}`]
        : [],
  });
  const clientHubMaterials = await client.maybeSelectAll<RemoteClientHubMaterialRow>("client_hub_materials", {
    select: "*",
    filters:
      syncType === "incremental" && syncState.get("client_hub_materials")
        ? [`created_at=gt.${syncState.get("client_hub_materials")}`]
        : [],
  });

  return {
    publishHistory,
    contentGroups,
    contentTasks,
    contentAttachments,
    clientHubRows,
    clientHubMaterials,
    cursorUpdates: {
      publish_history: maxTimestamp(publishHistory, (row) => row.created_at),
      content_tasks: maxTimestamp(contentTasks, (row) => row.updated_at ?? row.created_at),
      content_attachments: maxTimestamp(contentAttachments, (row) => row.created_at),
      client_hub: maxTimestamp(clientHubRows, (row) => row.updated_at),
      client_hub_materials: maxTimestamp(clientHubMaterials, (row) => row.created_at),
    },
  };
}

function groupSourcesByClient(manifest: ClientSourceManifest, remote: RemoteSourceBundle) {
  const aliasIndex = buildAliasIndex(manifest);
  const groupsByTaskId = new Map(remote.contentTasks.map((task) => [task.id, task]));
  const groupById = new Map(remote.contentGroups.map((group) => [group.id, group]));

  const prepared = new Map<string, ClientPreparedSources>();
  for (const client of manifest.operationalClients) {
    prepared.set(client.clientSlug, {
      client,
      aliases: buildAliasSetForClient(client.clientSlug, client.clientName, manifest.clientHubImportRows),
      importRows: [],
      liveClientHubRows: [],
      clientHubMaterials: [],
      localArtifacts: [],
      detectedReports: [],
      trelloAssets: [],
      publishHistory: [],
      contentAttachments: [],
    });
  }

  for (const row of manifest.clientHubImportRows) {
    const clientSlug = resolveClientSlug(aliasIndex, [row.clientSlug, row.clientName]);
    if (!clientSlug) continue;
    prepared.get(clientSlug)?.importRows.push(row);
  }

  for (const row of remote.clientHubRows) {
    const clientSlug = resolveClientSlug(aliasIndex, [row.client_slug, row.client_name]);
    if (!clientSlug) continue;
    prepared.get(clientSlug)?.liveClientHubRows.push(row);
  }

  for (const row of remote.clientHubMaterials) {
    const clientSlug = resolveClientSlug(aliasIndex, [row.client_slug, row.file_name]);
    if (!clientSlug) continue;
    prepared.get(clientSlug)?.clientHubMaterials.push(row);
  }

  for (const artifact of manifest.localArtifacts) {
    const clientSlug = resolveClientSlug(aliasIndex, [artifact.clientSlug, artifact.clientNameGuess, artifact.title, artifact.fileName], { allowPartial: true });
    if (!clientSlug) continue;
    prepared.get(clientSlug)?.localArtifacts.push(artifact);
  }

  for (const report of manifest.detectedReports) {
    const clientSlug = resolveClientSlug(aliasIndex, [report.clientName], { allowPartial: true });
    if (!clientSlug) continue;
    prepared.get(clientSlug)?.detectedReports.push(report);
  }

  for (const asset of manifest.trelloAssets) {
    const clientSlug = resolveClientSlug(aliasIndex, [asset.clientSlug, asset.clientNameGuess]);
    if (!clientSlug) continue;
    prepared.get(clientSlug)?.trelloAssets.push(asset);
  }

  for (const row of remote.publishHistory) {
    const clientSlug = resolveClientSlug(aliasIndex, [row.client_name, row.client_key]);
    if (!clientSlug) continue;
    prepared.get(clientSlug)?.publishHistory.push(row);
  }

  for (const attachment of remote.contentAttachments) {
    const task = attachment.task_id ? groupsByTaskId.get(attachment.task_id) : null;
    const group = task?.group_id ? groupById.get(task.group_id) : null;
    const clientSlug = resolveClientSlug(aliasIndex, [
      group?.client_id,
      group?.name,
      attachment.file_name,
      String(task?.publish_config?.["client_key"] ?? ""),
    ]);
    if (!clientSlug) continue;
    prepared.get(clientSlug)?.contentAttachments.push({
      ...attachment,
      taskName: task?.name ?? null,
      taskStatus: task?.status ?? null,
    });
  }

  return [...prepared.values()];
}

function selectCollectionKey(itemType: string) {
  switch (itemType) {
    case "story":
      return "stories";
    case "feed_post":
      return "feed";
    case "carousel":
      return "carousels";
    case "video":
    case "reel":
      return "videos";
    case "landing_page":
      return "landing-pages";
    case "asset":
      return "assets";
    case "reference":
      return "references";
    default:
      return "documents";
  }
}

function publishHistoryItemType(row: RemotePublishHistoryRow) {
  const urls = parseImageUrlField(row.image_url);
  const mediaHint = `${row.post_type ?? ""} ${row.media_type ?? ""}`.toLowerCase();
  const hasVideo = urls.some((url) => inferMediaKind(url) === "video");
  if (mediaHint.includes("story")) return "story";
  if (hasVideo || mediaHint.includes("reel") || mediaHint.includes("video")) return "video";
  if (urls.length > 1) return "carousel";
  return "feed_post";
}

function attachmentItemType(row: RemoteContentAttachmentRow) {
  const hint = `${row.category ?? ""} ${row.format_type ?? ""} ${row.file_type ?? ""}`.toLowerCase();
  const mediaKind = inferMediaKind(row.file_type || row.file_url);
  if (hint.includes("story")) return "story";
  if (mediaKind === "video") return "video";
  if (hint.includes("carousel")) return "carousel";
  if (mediaKind === "image") return "feed_post";
  if (mediaKind === "pdf" || mediaKind === "document") return "document";
  return "asset";
}

function trelloItemTypeToLibraryType(itemType: TrelloCardAsset["itemType"]) {
  if (itemType === "reference") return "reference";
  if (itemType === "document") return "document";
  return itemType;
}

async function createSyncRun(client: SupabaseRestClient, sourceName: string, syncType: "backfill" | "incremental", clientSlug?: string | null) {
  const [run] = await client.insert("library_sync_runs", [
    {
      sync_type: syncType,
      source_name: sourceName,
      client_slug: clientSlug ?? null,
      status: "running",
      stats: {},
      notes: null,
    },
  ]);
  return run as { id: string };
}

async function finalizeSyncRun(
  client: SupabaseRestClient,
  runId: string,
  status: "completed" | "failed" | "partial",
  stats: Record<string, unknown>,
  notes?: string | null,
) {
  await client.upsert("library_sync_runs", [
    {
      id: runId,
      status,
      stats,
      notes: notes ?? null,
      finished_at: new Date().toISOString(),
    },
  ], { onConflict: "id" });
}

async function updateSyncState(client: SupabaseRestClient, cursorUpdates: Record<string, string | null>) {
  const rows = Object.entries(cursorUpdates)
    .filter(([, value]) => value)
    .map(([syncKey, cursor]) => ({
      sync_key: syncKey,
      last_cursor: cursor,
      metadata: {},
    }));

  if (!rows.length) return;
  await client.upsert("library_sync_state", rows, { onConflict: "sync_key" });
}

async function logIssue(client: SupabaseRestClient, runId: string | null, clientSlug: string, severity: "info" | "warning" | "error", code: string, message: string, payload: Record<string, unknown> = {}) {
  await client.insert("library_sync_issues", [
    {
      sync_run_id: runId,
      client_slug: clientSlug,
      severity,
      code,
      message,
      payload,
    },
  ]);
}

async function ensureClientShell(client: SupabaseRestClient, source: ClientPreparedSources) {
  const [libraryClient] = await client.upsert("library_clients", [
    {
      client_slug: source.client.clientSlug,
      client_name: source.client.clientName,
      tenant: source.client.tenant,
      segment: source.client.segment,
      responsible: source.client.responsible,
      status: "active",
      canonical_brand_key: source.client.clientSlug,
      metadata: {
        imported_from: "parallel-client-library",
      },
    },
  ], { onConflict: "client_slug" });

  const collectionRows = await client.upsert(
    "library_collections",
    DEFAULT_COLLECTIONS.map((definition) => ({
      library_client_id: (libraryClient as { id: string }).id,
      collection_key: definition.key,
      title: definition.title,
      description: definition.description,
      sort_order: definition.sortOrder,
      metadata: {},
    })),
    { onConflict: "library_client_id,collection_key" },
  );

  const collectionMap = new Map(
    (collectionRows as Array<{ id: string; collection_key: string }>).map((row) => [row.collection_key, row.id]),
  );

  await client.upsert(
    "library_client_aliases",
    source.aliases.map((alias) => ({
      library_client_id: (libraryClient as { id: string }).id,
      alias_slug: normalizeKey(alias),
      alias_name: alias,
      alias_source: "backfill",
      metadata: {},
    })),
    { onConflict: "alias_slug" },
  );

  await client.upsert(
    "library_required_slots",
    REQUIRED_SLOTS.map((slot) => ({
      library_client_id: (libraryClient as { id: string }).id,
      slot_key: slot.slotKey,
      title: slot.title,
      collection_key: slot.collectionKey,
      slot_type: slot.slotType,
      status: "missing",
      instructions: slot.instructions,
      metadata: {},
    })),
    { onConflict: "library_client_id,slot_key" },
  );

  return {
    libraryClientId: (libraryClient as { id: string }).id,
    collectionMap,
  };
}

async function upsertItemWithSources(
  client: SupabaseRestClient,
  input: {
    libraryClientId: string;
    collectionId: string | null;
    itemKey: string;
    title: string;
    itemType: string;
    caption?: string | null;
    body?: string | null;
    status?: string | null;
    format?: string | null;
    platform?: string | null;
    thumbnailUrl?: string | null;
    primaryAssetUrl?: string | null;
    originalCreatedAt?: string | null;
    publishedAt?: string | null;
    metadata?: Record<string, unknown>;
    sources: Array<{
      provider: string;
      ref: string;
      parentRef?: string | null;
      url?: string | null;
      payload?: Record<string, unknown>;
    }>;
    media?: Array<{
      role: "primary" | "thumbnail" | "slide" | "attachment" | "preview" | "document";
      url?: string | null;
      fileName?: string | null;
      mimeType?: string | null;
      fileSize?: number | null;
      sortOrder?: number;
      storagePath?: string | null;
      storageBucket?: string | null;
      metadata?: Record<string, unknown>;
    }>;
  },
) {
  const [item] = await client.upsert(
    "library_items",
    [
      {
        library_client_id: input.libraryClientId,
        collection_id: input.collectionId,
        item_key: input.itemKey,
        title: input.title,
        item_type: input.itemType,
        status: input.status ?? "active",
        format: input.format ?? null,
        platform: input.platform ?? null,
        caption: input.caption ?? null,
        body: input.body ?? null,
        thumbnail_url: input.thumbnailUrl ?? null,
        primary_asset_url: input.primaryAssetUrl ?? null,
        original_created_at: input.originalCreatedAt ?? null,
        published_at: input.publishedAt ?? null,
        metadata: input.metadata ?? {},
      },
    ],
    { onConflict: "library_client_id,item_key" },
  );

  const itemId = (item as { id: string }).id;

  if (input.media?.length) {
    await client.upsert(
      "library_item_media",
      input.media.map((media, index) => ({
        library_item_id: itemId,
        media_role: media.role,
        media_kind: inferMediaKind(media.mimeType || media.url),
        media_url: media.url ?? null,
        storage_bucket: media.storageBucket ?? null,
        storage_path: media.storagePath ?? null,
        file_name: media.fileName ?? null,
        mime_type: media.mimeType ?? null,
        file_size: media.fileSize ?? null,
        sort_order: media.sortOrder ?? index,
        metadata: media.metadata ?? {},
      })),
      { onConflict: "library_item_id,media_role,media_url,storage_path" },
    );
  }

  if (input.sources.length) {
    await client.upsert(
      "library_item_sources",
      input.sources.map((source) => ({
        library_item_id: itemId,
        source_provider: source.provider,
        source_ref: source.ref,
        source_parent_ref: source.parentRef ?? null,
        source_url: source.url ?? null,
        source_payload: source.payload ?? {},
      })),
      { onConflict: "source_provider,source_ref" },
    );
  }

  return itemId;
}

async function importRealItemsForClient(
  client: SupabaseRestClient,
  runId: string | null,
  source: ClientPreparedSources,
  shell: { libraryClientId: string; collectionMap: Map<string, string> },
) {
  let itemCount = 0;
  let issueCount = 0;

  const upsertDocument = async (itemKey: string, title: string, body: string, collectionKey = "documents", metadata: Record<string, unknown> = {}, sourceDef?: { provider: string; ref: string; url?: string | null; payload?: Record<string, unknown> }) => {
    await upsertItemWithSources(client, {
      libraryClientId: shell.libraryClientId,
      collectionId: shell.collectionMap.get(collectionKey) ?? null,
      itemKey,
      title,
      itemType: collectionKey === "references" ? "reference" : "document",
      body,
      metadata,
      sources: sourceDef ? [sourceDef] : [],
    });
    itemCount += 1;
  };

  const hubRows = source.liveClientHubRows.length ? source.liveClientHubRows : source.importRows.map((row) => ({
    client_slug: row.clientSlug,
    client_name: row.clientName,
    tenant: row.tenant,
    segment: row.segment,
    responsible: row.responsible,
    status: row.status,
    contract_package: row.contractPackage,
    website_url: row.websiteUrl,
    drive_folder_url: row.driveFolderUrl,
    approval_url: row.approvalUrl,
    logo_url: row.logoUrl,
    social_links: row.socialLinks,
    notes: row.notes,
  }));

  for (const row of hubRows) {
    if (row.website_url) {
      await upsertDocument(
        "website-official",
        `Website oficial — ${source.client.clientName}`,
        String(row.website_url),
        "references",
        { kind: "website" },
        { provider: "client_hub", ref: `website:${source.client.clientSlug}`, url: String(row.website_url) },
      );
    }
    if (row.drive_folder_url) {
      await upsertDocument(
        "drive-materials",
        `Drive de materiais — ${source.client.clientName}`,
        String(row.drive_folder_url),
        "assets",
        { kind: "drive" },
        { provider: "client_hub", ref: `drive:${source.client.clientSlug}`, url: String(row.drive_folder_url) },
      );
    }
    if (row.approval_url) {
      await upsertDocument(
        "approval-link",
        `Canva de aprovação — ${source.client.clientName}`,
        String(row.approval_url),
        "documents",
        { kind: "approval" },
        { provider: "client_hub", ref: `approval:${source.client.clientSlug}`, url: String(row.approval_url) },
      );
    }
    if (row.logo_url) {
      await upsertDocument(
        "logo-reference",
        `Logo oficial — ${source.client.clientName}`,
        String(row.logo_url),
        "design-system",
        { kind: "logo-reference" },
        { provider: "client_hub", ref: `logo:${source.client.clientSlug}`, url: String(row.logo_url) },
      );
    }
    if (row.contract_package) {
      await upsertDocument(
        "contract-package",
        `Pacote contratado — ${source.client.clientName}`,
        String(row.contract_package),
        "documents",
        { kind: "contract-package" },
        { provider: "client_hub", ref: `contract:${source.client.clientSlug}` },
      );
    }
    if (row.tone_of_voice) {
      await upsertDocument(
        "tone-of-voice",
        `Tom de voz — ${source.client.clientName}`,
        String(row.tone_of_voice),
        "documents",
        { kind: "tone-of-voice" },
        { provider: "client_hub", ref: `tone:${source.client.clientSlug}` },
      );
    }
    if (row.persona_description) {
      await upsertDocument(
        "persona-description",
        `Persona — ${source.client.clientName}`,
        String(row.persona_description),
        "documents",
        { kind: "persona" },
        { provider: "client_hub", ref: `persona:${source.client.clientSlug}` },
      );
    }
    const socialLinks = parseJsonField(row.social_links) as Record<string, string> | null;
    if (socialLinks && Object.keys(socialLinks).length > 0) {
      await upsertDocument(
        "social-links",
        `Links sociais — ${source.client.clientName}`,
        Object.entries(socialLinks).map(([platform, url]) => `- ${platform}: ${url}`).join("\n"),
        "references",
        { kind: "social-links" },
        { provider: "client_hub", ref: `social:${source.client.clientSlug}`, payload: socialLinks },
      );
    }
    if (row.notes) {
      await upsertDocument(
        "notes",
        `Notas consolidadas — ${source.client.clientName}`,
        String(row.notes),
        "documents",
        { kind: "notes" },
        { provider: "client_hub", ref: `notes:${source.client.clientSlug}` },
      );
    }
  }

  for (const material of source.clientHubMaterials) {
    await upsertItemWithSources(client, {
      libraryClientId: shell.libraryClientId,
      collectionId: shell.collectionMap.get("assets") ?? null,
      itemKey: `client-hub-material-${material.id}`,
      title: material.file_name || `Material ${material.id}`,
      itemType: inferMediaKind(material.mime_type || material.file_url) === "document" || inferMediaKind(material.mime_type || material.file_url) === "pdf" ? "document" : "asset",
      primaryAssetUrl: material.file_url ?? null,
      originalCreatedAt: material.created_at ?? null,
      metadata: {
        category: material.category,
        uploadedBy: material.uploaded_by,
      },
      sources: [
        {
          provider: "client_hub_materials",
          ref: material.id,
          url: material.file_url ?? null,
          payload: material,
        },
      ],
      media: material.file_url
        ? [
            {
              role: "primary",
              url: material.file_url,
              fileName: material.file_name ?? null,
              mimeType: material.mime_type ?? null,
              fileSize: material.file_size ?? null,
              storagePath: material.storage_path ?? null,
              storageBucket: material.storage_path ? "client-hub-materials" : null,
            },
          ]
        : [],
    });
    itemCount += 1;
  }

  for (const artifact of source.localArtifacts) {
    await upsertDocument(
      `local-artifact-${normalizeKey(artifact.fileName)}`,
      artifact.title,
      `Arquivo local: ${path.relative(process.cwd(), artifact.filePath)}\n\n${artifact.summary}`,
      artifact.kind === "html" ? "references" : "documents",
      {
        kind: "local-artifact",
        filePath: artifact.filePath,
        fileName: artifact.fileName,
      },
      { provider: "local_file", ref: artifact.filePath, payload: { title: artifact.title } },
    );
  }

  for (const report of source.detectedReports) {
    await upsertDocument(
      `detected-report-${normalizeKey(report.filename)}`,
      `Relatório detectado — ${report.periodLabel || report.filename}`,
      [
        `Arquivo: ${report.filename}`,
        report.periodLabel ? `Período: ${report.periodLabel}` : null,
        report.filepath ? `Origem: ${report.filepath}` : null,
      ].filter(Boolean).join("\n"),
      "documents",
      { kind: "report-index" },
      { provider: "report_index", ref: `${source.client.clientSlug}:${report.filename}`, payload: report as unknown as Record<string, unknown> },
    );
  }

  for (const asset of source.trelloAssets) {
    const collectionKey = selectCollectionKey(trelloItemTypeToLibraryType(asset.itemType));
    await upsertItemWithSources(client, {
      libraryClientId: shell.libraryClientId,
      collectionId: shell.collectionMap.get(collectionKey) ?? null,
      itemKey: `trello-card-${asset.cardId}`,
      title: asset.cardName,
      itemType: trelloItemTypeToLibraryType(asset.itemType),
      body: asset.description ?? null,
      originalCreatedAt: asset.dueAt ?? null,
      metadata: {
        labels: asset.labels,
        sourceListClient: asset.clientNameGuess,
      },
      sources: [
        {
          provider: "trello_card",
          ref: asset.cardId,
          url: asset.cardUrl ?? null,
          payload: {
            labels: asset.labels,
          },
        },
      ],
      media: asset.attachments.map((attachment, index) => ({
        role: index === 0 ? "primary" : "attachment",
        url: attachment.url,
        fileName: attachment.name,
        mimeType: attachment.mimeType,
        fileSize: attachment.bytes,
        sortOrder: index,
      })),
    });
    itemCount += 1;
  }

  for (const row of source.publishHistory) {
    const itemType = publishHistoryItemType(row);
    const imageUrls = parseImageUrlField(row.image_url);
    await upsertItemWithSources(client, {
      libraryClientId: shell.libraryClientId,
      collectionId: shell.collectionMap.get(selectCollectionKey(itemType)) ?? null,
      itemKey: `publish-history-${row.id}`,
      title: row.caption?.slice(0, 80) || `${row.platform?.toUpperCase() || "POST"} ${row.id}`,
      itemType,
      caption: row.caption ?? null,
      body: row.caption ?? null,
      platform: row.platform ?? null,
      status: row.status?.toLowerCase() === "published" ? "active" : "reference-only",
      originalCreatedAt: row.created_at ?? null,
      publishedAt: row.published_at ?? null,
      primaryAssetUrl: imageUrls[0] ?? null,
      metadata: {
        scheduledFor: row.scheduled_for,
        postType: row.post_type,
        mediaType: row.media_type,
        userName: row.user_name,
        taskId: row.task_id,
      },
      sources: [
        {
          provider: "publish_history",
          ref: row.id,
          payload: row as unknown as Record<string, unknown>,
        },
      ],
      media: imageUrls.map((url, index) => ({
        role: itemType === "carousel" ? "slide" : index === 0 ? "primary" : "attachment",
        url,
        sortOrder: index,
      })),
    });
    itemCount += 1;
  }

  for (const row of source.contentAttachments) {
    const itemType = attachmentItemType(row);
    await upsertItemWithSources(client, {
      libraryClientId: shell.libraryClientId,
      collectionId: shell.collectionMap.get(selectCollectionKey(itemType)) ?? null,
      itemKey: `content-attachment-${row.id}`,
      title: row.file_name || row.taskName || `Attachment ${row.id}`,
      itemType,
      body: row.taskName ? `Task: ${row.taskName}` : null,
      originalCreatedAt: row.created_at ?? null,
      primaryAssetUrl: row.file_url ?? null,
      metadata: {
        taskName: row.taskName,
        taskStatus: row.taskStatus,
        attachmentCategory: row.category,
        formatType: row.format_type,
        uploadedBy: row.uploaded_by,
      },
      sources: [
        {
          provider: "content_attachment",
          ref: row.id,
          url: row.file_url ?? null,
          payload: row as unknown as Record<string, unknown>,
        },
      ],
      media: row.file_url
        ? [
            {
              role: "primary",
              url: row.file_url,
              fileName: row.file_name ?? null,
              mimeType: row.file_type ?? null,
              fileSize: row.file_size ?? null,
            },
          ]
        : [],
    });
    itemCount += 1;
  }

  const realSourceCount =
    source.liveClientHubRows.length +
    source.importRows.length +
    source.clientHubMaterials.length +
    source.localArtifacts.length +
    source.detectedReports.length +
    source.trelloAssets.length +
    source.publishHistory.length +
    source.contentAttachments.length;

  if (realSourceCount === 0) {
    await logIssue(
      client,
      runId,
      source.client.clientSlug,
      "warning",
      "missing_real_assets",
      "Cliente sem material real detectado nas fontes atuais. Apenas slots manuais foram preparados.",
      { clientName: source.client.clientName },
    );
    issueCount += 1;
  }

  return { itemCount, issueCount };
}

export async function runLibrarySync(options: SyncOptions) {
  const manifest = buildClientSourceManifest(options.rootDir);
  const client = createSupabaseRestClientFromEnv();
  const remote = client
    ? await loadRemoteSources(client, options.syncType)
    : {
        publishHistory: [],
        contentGroups: [],
        contentTasks: [],
        contentAttachments: [],
        clientHubRows: [],
        clientHubMaterials: [],
      };

  const preparedClients = groupSourcesByClient(manifest, remote);
  const filtered = options.clientFilter
    ? preparedClients.filter((entry) => normalizeKey(entry.client.clientName) === normalizeKey(options.clientFilter) || entry.client.clientSlug === normalizeKey(options.clientFilter))
    : preparedClients;

  if (!options.write || !client) {
    return {
      mode: options.write ? "missing-credentials" : "dry-run",
      clients: filtered.map((entry) => ({
        clientSlug: entry.client.clientSlug,
        clientName: entry.client.clientName,
        importRows: entry.importRows.length,
        liveClientHubRows: entry.liveClientHubRows.length,
        clientHubMaterials: entry.clientHubMaterials.length,
        localArtifacts: entry.localArtifacts.length,
        detectedReports: entry.detectedReports.length,
        trelloAssets: entry.trelloAssets.length,
        publishHistory: entry.publishHistory.length,
        contentAttachments: entry.contentAttachments.length,
      })),
    };
  }

  const run = await createSyncRun(client, "parallel-client-library", options.syncType, options.clientFilter ?? null);
  const stats: BackfillStats = {
    clientsProcessed: 0,
    itemsUpserted: 0,
    mediaUpserted: 0,
    slotsUpserted: 0,
    issuesLogged: 0,
  };

  try {
    for (const entry of filtered) {
      const shell = await ensureClientShell(client, entry);
      stats.clientsProcessed += 1;
      stats.slotsUpserted += REQUIRED_SLOTS.length;
      const imported = await importRealItemsForClient(client, run.id, entry, shell);
      stats.itemsUpserted += imported.itemCount;
      stats.issuesLogged += imported.issueCount;
    }

    if (options.syncType === "incremental") {
      await updateSyncState(client, remote.cursorUpdates);
    }

    await finalizeSyncRun(client, run.id, "completed", stats);
    return { mode: "write", stats };
  } catch (error) {
    await finalizeSyncRun(client, run.id, "failed", stats, String(error));
    throw error;
  }
}
