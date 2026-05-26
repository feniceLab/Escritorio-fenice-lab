// src/db/schema-sqlite.ts
import { sqliteTable, text, integer, index, unique, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  loginId: text("login_id").unique().notNull(),
  nickname: text("nickname").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  systemRole: text("system_role").notNull().default("user"),
  lastActiveAt: text("last_active_at"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const characters = sqliteTable("characters", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  telegramChatId: text("telegram_chat_id"),
  appearance: text("appearance").notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("idx_characters_user_id").on(table.userId),
]);

export const groups = sqliteTable("groups", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const channels = sqliteTable("channels", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: text("owner_id").notNull().references(() => users.id),
  groupId: text("group_id").references(() => groups.id, { onDelete: "set null" }),
  mapData: text("map_data"),
  mapConfig: text("map_config"),
  isPublic: integer("is_public", { mode: "boolean" }).default(true),
  inviteCode: text("invite_code").unique(),
  maxPlayers: integer("max_players").default(50),
  password: text("password"),
  gatewayConfig: text("gateway_config"),
  channelType: text("channel_type").default("standard"),
  clientName: text("client_name"),
  clientLogo: text("client_logo"),
  parentChannelId: text("parent_channel_id"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const gatewayResources = sqliteTable("gateway_resources", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ownerUserId: text("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  baseUrl: text("base_url").notNull(),
  tokenEncrypted: text("token_encrypted").notNull(),
  pairedDeviceId: text("paired_device_id"),
  provider: text("provider").notNull().default("openclaw"),
  workspacePath: text("workspace_path"),
  lastValidatedAt: text("last_validated_at"),
  lastValidationStatus: text("last_validation_status"),
  lastValidationError: text("last_validation_error"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()).notNull(),
}, (table) => [
  index("idx_gateway_resources_owner_user_id").on(table.ownerUserId),
]);

export const gatewayShares = sqliteTable("gateway_shares", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  gatewayId: text("gateway_id").notNull().references(() => gatewayResources.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("use"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()).notNull(),
}, (table) => [
  index("idx_gateway_shares_gateway_id").on(table.gatewayId),
  index("idx_gateway_shares_user_id").on(table.userId),
  uniqueIndex("gateway_shares_gateway_user_idx").on(table.gatewayId, table.userId),
]);

export const channelGatewayBindings = sqliteTable("channel_gateway_bindings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  channelId: text("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  gatewayId: text("gateway_id").notNull().references(() => gatewayResources.id, { onDelete: "cascade" }),
  boundByUserId: text("bound_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  boundAt: text("bound_at").$defaultFn(() => new Date().toISOString()).notNull(),
}, (table) => [
  index("idx_channel_gateway_bindings_gateway_id").on(table.gatewayId),
  uniqueIndex("channel_gateway_bindings_channel_idx").on(table.channelId),
]);

export const groupMembers = sqliteTable("group_members", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  groupId: text("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  approvedBy: text("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: text("approved_at"),
  joinedAt: text("joined_at").$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("idx_group_members_group_id").on(table.groupId),
  index("idx_group_members_user_id").on(table.userId),
  unique("group_members_group_user_unique").on(table.groupId, table.userId),
]);

export const groupInvites = sqliteTable("group_invites", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  groupId: text("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  token: text("token").unique().notNull(),
  createdBy: text("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetUserId: text("target_user_id").references(() => users.id, { onDelete: "set null" }),
  targetLoginId: text("target_login_id"),
  expiresAt: text("expires_at"),
  acceptedBy: text("accepted_by").references(() => users.id, { onDelete: "set null" }),
  acceptedAt: text("accepted_at"),
  revokedAt: text("revoked_at"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("idx_group_invites_group_id").on(table.groupId),
  index("idx_group_invites_target_user_id").on(table.targetUserId),
]);

export const groupJoinRequests = sqliteTable("group_join_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  groupId: text("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  message: text("message"),
  reviewedBy: text("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: text("reviewed_at"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("idx_group_join_requests_group_id").on(table.groupId),
  index("idx_group_join_requests_user_id").on(table.userId),
  unique("group_join_requests_group_user_unique").on(table.groupId, table.userId),
]);

export const groupPermissions = sqliteTable("group_permissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  groupId: text("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  permissionKey: text("permission_key").notNull(),
  effect: text("effect").notNull(),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("idx_group_permissions_group_id").on(table.groupId),
  unique("group_permissions_group_permission_unique").on(table.groupId, table.permissionKey),
]);

export const userPermissionOverrides = sqliteTable("user_permission_overrides", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  groupId: text("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  permissionKey: text("permission_key").notNull(),
  effect: text("effect").notNull(),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("idx_user_permission_overrides_group_id").on(table.groupId),
  index("idx_user_permission_overrides_user_id").on(table.userId),
  unique("user_permission_overrides_group_user_permission_unique").on(table.groupId, table.userId, table.permissionKey),
]);

export const channelMembers = sqliteTable("channel_members", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  channelId: text("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  lastX: integer("last_x"),
  lastY: integer("last_y"),
  joinedAt: text("joined_at").$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("idx_channel_members_channel_id").on(table.channelId),
  index("idx_channel_members_user_id").on(table.userId),
  unique("channel_members_channel_user_unique").on(table.channelId, table.userId),
]);

export const maps = sqliteTable("maps", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  tilemapPath: text("tilemap_path").notNull(),
  config: text("config"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const mapPortals = sqliteTable("map_portals", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fromMapId: text("from_map_id").references(() => maps.id),
  toMapId: text("to_map_id").references(() => maps.id),
  fromX: integer("from_x").notNull(),
  fromY: integer("from_y").notNull(),
  toX: integer("to_x").notNull(),
  toY: integer("to_y").notNull(),
});

export const mapTemplates = sqliteTable("map_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("🗺️"),
  description: text("description"),
  cols: integer("cols").notNull(),
  rows: integer("rows").notNull(),
  layers: text("layers"),
  objects: text("objects"),
  tiledJson: text("tiled_json"),
  thumbnail: text("thumbnail"),
  spawnCol: integer("spawn_col").notNull(),
  spawnRow: integer("spawn_row").notNull(),
  tags: text("tags"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const npcs = sqliteTable("npcs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  channelId: text("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  positionX: integer("position_x").notNull(),
  positionY: integer("position_y").notNull(),
  direction: text("direction").default("down"),
  appearance: text("appearance").notNull(),
  openclawConfig: text("openclaw_config").notNull(),
  totalTokens: integer("total_tokens").notNull().default(0),
  reportsToId: text("reports_to_id"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("idx_npcs_channel_id").on(table.channelId),
  index("idx_npcs_reports_to_id").on(table.reportsToId),
  unique("npcs_channel_position_unique").on(table.channelId, table.positionX, table.positionY),
]);

export const tokenUsageLogs = sqliteTable("token_usage_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  npcId: text("npc_id").notNull().references(() => npcs.id, { onDelete: "cascade" }),
  channelId: text("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  promptTokens: integer("prompt_tokens").notNull().default(0),
  completionTokens: integer("completion_tokens").notNull().default(0),
  estimatedCost: text("estimated_cost").notNull().default("0"),
  // Accepted values: 'dm' | 'meeting' | 'task' | 'automation' | 'tool' | 'library-context'
  contextKind: text("context_kind").notNull(),
  model: text("model"),
  provider: text("provider"),
  toolName: text("tool_name"),
  operationId: text("operation_id"),
  durationMs: integer("duration_ms"),
  label: text("label"),
  isRealUsage: integer("is_real_usage", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("idx_token_usage_npc").on(table.npcId),
  index("idx_token_usage_channel").on(table.channelId),
  index("idx_token_usage_created").on(table.createdAt),
  index("idx_token_usage_kind").on(table.contextKind),
]);

export const npcReports = sqliteTable("npc_reports", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  channelId: text("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  npcId: text("npc_id").notNull().references(() => npcs.id, { onDelete: "cascade" }),
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  targetUserId: text("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()).notNull(),
  deliveredAt: text("delivered_at"),
  consumedAt: text("consumed_at"),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  characterId: text("character_id").notNull().references(() => characters.id),
  npcId: text("npc_id").notNull().references(() => npcs.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("idx_chat_messages_lookup").on(table.characterId, table.npcId, table.createdAt),
]);

export const meetingMinutes = sqliteTable("meeting_minutes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  channelId: text("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  transcript: text("transcript").notNull(),
  participants: text("participants").notNull().default("[]"),
  totalTurns: integer("total_turns").notNull().default(0),
  durationSeconds: integer("duration_seconds"),
  initiatorId: text("initiator_id").references(() => users.id, { onDelete: "set null" }),
  keyTopics: text("key_topics").notNull().default("[]"),
  conclusions: text("conclusions"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("idx_meeting_minutes_channel").on(table.channelId),
  index("idx_meeting_minutes_created").on(table.createdAt),
]);

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  channelId: text("channel_id").notNull().references(() => channels.id),
  npcId: text("npc_id").notNull().references(() => npcs.id, { onDelete: "cascade" }),
  assignerId: text("assigner_id").notNull().references(() => characters.id),
  assignerNpcId: text("assigner_npc_id"),
  npcTaskId: text("npc_task_id").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  status: text("status").notNull().default("pending"),
  recurrence: text("recurrence").notNull().default("once"),
  scheduledTime: text("scheduled_time"),
  scheduledDay: integer("scheduled_day"),
  dueAt: text("due_at"),
  requiresApproval: integer("requires_approval", { mode: "boolean" }).notNull().default(false),
  approvedAt: text("approved_at"),
  approvedBy: text("approved_by"),
  autoNudgeCount: integer("auto_nudge_count").notNull().default(0),
  autoNudgeMax: integer("auto_nudge_max").notNull().default(5),
  lastNudgedAt: text("last_nudged_at"),
  lastReportedAt: text("last_reported_at"),
  stalledAt: text("stalled_at"),
  stalledReason: text("stalled_reason"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
  completedAt: text("completed_at"),
}, (table) => [
  index("idx_tasks_channel").on(table.channelId),
  index("idx_tasks_npc").on(table.npcId),
  uniqueIndex("idx_tasks_npc_task_id").on(table.npcId, table.npcTaskId),
]);

export const automationJobs = sqliteTable("automation_jobs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: text("type").notNull(),
  status: text("status").notNull().default("pending"),
  channelId: text("channel_id").references(() => channels.id, { onDelete: "cascade" }),
  npcId: text("npc_id").references(() => npcs.id, { onDelete: "set null" }),
  createdByUserId: text("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  approvalRequestId: text("approval_request_id"),
  payload: text("payload").notNull().default("{}"),
  result: text("result"),
  error: text("error"),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  runAfter: text("run_after"),
  lockedAt: text("locked_at"),
  startedAt: text("started_at"),
  processedAt: text("processed_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("idx_automation_jobs_status_run_after").on(table.status, table.runAfter),
  index("idx_automation_jobs_channel").on(table.channelId),
  index("idx_automation_jobs_npc").on(table.npcId),
  index("idx_automation_jobs_created").on(table.createdAt),
]);

export const approvalRequests = sqliteTable("approval_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  channelId: text("channel_id").references(() => channels.id, { onDelete: "cascade" }),
  npcId: text("npc_id").references(() => npcs.id, { onDelete: "set null" }),
  requestedByUserId: text("requested_by_user_id").references(() => users.id, { onDelete: "set null" }),
  reviewedByUserId: text("reviewed_by_user_id").references(() => users.id, { onDelete: "set null" }),
  actionType: text("action_type").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  payload: text("payload").notNull().default("{}"),
  status: text("status").notNull().default("pending"),
  decisionReason: text("decision_reason"),
  reviewedAt: text("reviewed_at"),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("idx_approval_requests_status").on(table.status),
  index("idx_approval_requests_channel").on(table.channelId),
  index("idx_approval_requests_npc").on(table.npcId),
  index("idx_approval_requests_created").on(table.createdAt),
]);

export const npcActionLogs = sqliteTable("npc_action_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  channelId: text("channel_id").references(() => channels.id, { onDelete: "cascade" }),
  npcId: text("npc_id").references(() => npcs.id, { onDelete: "set null" }),
  jobId: text("job_id").references(() => automationJobs.id, { onDelete: "set null" }),
  approvalRequestId: text("approval_request_id").references(() => approvalRequests.id, { onDelete: "set null" }),
  actionType: text("action_type").notNull(),
  status: text("status").notNull(),
  reason: text("reason"),
  input: text("input"),
  output: text("output"),
  error: text("error"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("idx_npc_action_logs_channel_created").on(table.channelId, table.createdAt),
  index("idx_npc_action_logs_npc_created").on(table.npcId, table.createdAt),
  index("idx_npc_action_logs_job").on(table.jobId),
  index("idx_npc_action_logs_status").on(table.status),
]);

export const stamps = sqliteTable("stamps", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  cols: integer("cols").notNull(),
  rows: integer("rows").notNull(),
  tileWidth: integer("tile_width").notNull().default(32),
  tileHeight: integer("tile_height").notNull().default(32),
  layers: text("layers").notNull(),
  tilesets: text("tilesets").notNull(),
  thumbnail: text("thumbnail"),
  createdBy: text("created_by").references(() => users.id),
  builtIn: integer("built_in", { mode: "boolean" }).default(false).notNull(),
  tags: text("tags"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const tilesetImages = sqliteTable("tileset_images", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  tilewidth: integer("tilewidth").notNull().default(32),
  tileheight: integer("tileheight").notNull().default(32),
  columns: integer("columns").notNull(),
  tilecount: integer("tilecount").notNull(),
  image: text("image").notNull(), // base64 data URL
  builtIn: integer("built_in", { mode: "boolean" }).default(false).notNull(),
  tags: text("tags"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
}, (table) => [
  uniqueIndex("idx_tileset_images_name").on(table.name),
]);

// ── Projects ──────────────────────────────────────────────
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  thumbnail: text("thumbnail"),
  tiledJson: text("tiled_json"),
  settings: text("settings"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()).notNull(),
});

export const projectTilesets = sqliteTable("project_tilesets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  tilesetId: text("tileset_id").notNull().references(() => tilesetImages.id, { onDelete: "cascade" }),
  firstgid: integer("firstgid").notNull(),
  addedAt: text("added_at").$defaultFn(() => new Date().toISOString()).notNull(),
}, (t) => [
  unique("uq_project_tileset").on(t.projectId, t.tilesetId),
]);

export const projectStamps = sqliteTable("project_stamps", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  stampId: text("stamp_id").notNull().references(() => stamps.id, { onDelete: "cascade" }),
  addedAt: text("added_at").$defaultFn(() => new Date().toISOString()).notNull(),
}, (t) => [
  unique("uq_project_stamp").on(t.projectId, t.stampId),
]);

// -----------------------------------------------------------------------------
// AI Skills & MCP Severs (Agency Global Library)
// -----------------------------------------------------------------------------

export const mcpServers = sqliteTable("mcp_servers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  command: text("command").notNull(),
  args: text("args", { mode: "json" }).default("[]"),
  envVariables: text("env_variables", { mode: "json" }).default("{}"),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const skills = sqliteTable("skills", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  instructions: text("instructions").notNull(),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const channelMcpServers = sqliteTable("channel_mcp_servers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  channelId: text("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  mcpServerId: text("mcp_server_id").notNull().references(() => mcpServers.id, { onDelete: "cascade" }),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  unq: uniqueIndex("channel_mcp_servers_unique").on(table.channelId, table.mcpServerId),
}));

export const channelSkills = sqliteTable("channel_skills", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  channelId: text("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  skillId: text("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  unq: uniqueIndex("channel_skills_unique").on(table.channelId, table.skillId),
}));

export const channelLibraryItems = sqliteTable("channel_library_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  channelId: text("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  layer: text("layer").notNull(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  content: text("content"),
  metadata: text("metadata"),
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  channelLayerIdx: index("idx_channel_library_items_channel_layer").on(table.channelId, table.layer),
  unq: uniqueIndex("channel_library_items_unique").on(table.channelId, table.layer, table.category, table.name),
}));

export const npcLibraryItems = sqliteTable("npc_library_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  npcId: text("npc_id").notNull().references(() => npcs.id, { onDelete: "cascade" }),
  layer: text("layer").notNull(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  content: text("content"),
  metadata: text("metadata"),
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  npcLayerIdx: index("idx_npc_library_items_npc_layer").on(table.npcId, table.layer),
  unq: uniqueIndex("npc_library_items_unique").on(table.npcId, table.layer, table.category, table.name),
}));

export const npcMemoryItems = sqliteTable("npc_memory_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  npcId: text("npc_id").notNull().references(() => npcs.id, { onDelete: "cascade" }),
  memoryType: text("memory_type").notNull().default("fact"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"),
  pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  npcTypeIdx: index("idx_npc_memory_items_npc_type").on(table.npcId, table.memoryType),
  npcCreatedIdx: index("idx_npc_memory_items_npc_created").on(table.npcId, table.createdAt),
}));

export const agencyReports = sqliteTable("agency_reports", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  channelId: text("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  agentId: text("agent_id"),
  content: text("content").notNull(),
  analysisMode: text("analysis_mode").default("daily"),
  reportDate: text("report_date").$defaultFn(() => new Date().toISOString()),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// -----------------------------------------------------------------------------
// Office Intelligence Layer
// -----------------------------------------------------------------------------

export const officeClients = sqliteTable("office_clients", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  channelId: text("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  ownerUserId: text("owner_user_id").references(() => users.id, { onDelete: "set null" }),
  summary: text("summary"),
  profileJson: text("profile_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  uniqueIndex("office_clients_channel_unique").on(table.channelId),
  index("idx_office_clients_status").on(table.status),
  index("idx_office_clients_owner").on(table.ownerUserId),
]);

export const officeMemories = sqliteTable("office_memories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  scope: text("scope").notNull().default("client"),
  clientId: text("client_id").references(() => officeClients.id, { onDelete: "cascade" }),
  channelId: text("channel_id").references(() => channels.id, { onDelete: "cascade" }),
  npcId: text("npc_id").references(() => npcs.id, { onDelete: "set null" }),
  memoryType: text("memory_type").notNull().default("fact"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  importance: integer("importance").notNull().default(3),
  sourceType: text("source_type"),
  sourceId: text("source_id"),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("idx_office_memories_client").on(table.clientId),
  index("idx_office_memories_channel").on(table.channelId),
  index("idx_office_memories_npc").on(table.npcId),
  index("idx_office_memories_importance").on(table.importance),
]);

export const officeNotifications = sqliteTable("office_notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").references(() => officeClients.id, { onDelete: "cascade" }),
  channelId: text("channel_id").references(() => channels.id, { onDelete: "cascade" }),
  npcId: text("npc_id").references(() => npcs.id, { onDelete: "set null" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  priority: text("priority").notNull().default("normal"),
  title: text("title").notNull(),
  body: text("body"),
  status: text("status").notNull().default("unread"),
  actionType: text("action_type"),
  actionPayload: text("action_payload").notNull().default("{}"),
  sourceType: text("source_type"),
  sourceId: text("source_id"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  readAt: text("read_at"),
  resolvedAt: text("resolved_at"),
}, (table) => [
  index("idx_office_notifications_status").on(table.status),
  index("idx_office_notifications_client").on(table.clientId),
  index("idx_office_notifications_channel").on(table.channelId),
  index("idx_office_notifications_created").on(table.createdAt),
]);

export const officeContextSnapshots = sqliteTable("office_context_snapshots", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").references(() => officeClients.id, { onDelete: "cascade" }),
  channelId: text("channel_id").references(() => channels.id, { onDelete: "cascade" }),
  contextKind: text("context_kind").notNull(),
  summary: text("summary"),
  payload: text("payload").notNull().default("{}"),
  tokenEstimate: integer("token_estimate").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  expiresAt: text("expires_at"),
}, (table) => [
  index("idx_office_context_client_kind").on(table.clientId, table.contextKind),
  index("idx_office_context_created").on(table.createdAt),
]);

export const officeAgentRuns = sqliteTable("office_agent_runs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").references(() => officeClients.id, { onDelete: "cascade" }),
  channelId: text("channel_id").references(() => channels.id, { onDelete: "cascade" }),
  npcId: text("npc_id").references(() => npcs.id, { onDelete: "set null" }),
  taskId: text("task_id").references(() => tasks.id, { onDelete: "set null" }),
  request: text("request").notNull().default("{}"),
  contextSnapshotId: text("context_snapshot_id").references(() => officeContextSnapshots.id, { onDelete: "set null" }),
  output: text("output"),
  status: text("status").notNull().default("completed"),
  tokensUsed: integer("tokens_used").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("idx_office_agent_runs_client").on(table.clientId),
  index("idx_office_agent_runs_npc").on(table.npcId),
  index("idx_office_agent_runs_created").on(table.createdAt),
]);

export const telegramClientGroups = sqliteTable("telegram_client_groups", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").references(() => officeClients.id, { onDelete: "set null" }),
  channelId: text("channel_id").references(() => channels.id, { onDelete: "set null" }),
  clientSlug: text("client_slug"),
  clientName: text("client_name").notNull(),
  telegramChatId: text("telegram_chat_id").notNull().unique(),
  telegramWebUrl: text("telegram_web_url"),
  groupType: text("group_type").notNull().default("client"),
  allowedNpcs: text("allowed_npcs").notNull().default("[]"),
  notificationRules: text("notification_rules").notNull().default("{}"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("idx_telegram_client_groups_client").on(table.clientId),
  index("idx_telegram_client_groups_channel").on(table.channelId),
  index("idx_telegram_client_groups_slug").on(table.clientSlug),
  index("idx_telegram_client_groups_active").on(table.active),
]);

export const telegramAgentRoutines = sqliteTable("telegram_agent_routines", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  routineSlug: text("routine_slug").notNull().unique(),
  npcId: text("npc_id").references(() => npcs.id, { onDelete: "set null" }),
  label: text("label").notNull(),
  scheduleLocal: text("schedule_local").notNull(),
  timezone: text("timezone").notNull().default("America/Sao_Paulo"),
  targetScope: text("target_scope").notNull().default("operational_group"),
  actionType: text("action_type").notNull().default("telegram_digest"),
  payloadJson: text("payload_json").notNull().default("{}"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  lastRunKey: text("last_run_key"),
  lastRunAt: text("last_run_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("idx_telegram_agent_routines_active_schedule").on(table.active, table.scheduleLocal),
  index("idx_telegram_agent_routines_npc").on(table.npcId),
]);
