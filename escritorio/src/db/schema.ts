// src/db/schema.ts
import { pgTable, uuid, varchar, text, integer, jsonb, timestamp, boolean, index, unique, uniqueIndex, decimal } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  loginId: varchar("login_id", { length: 50 }).unique().notNull(),
  nickname: varchar("nickname", { length: 50 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  systemRole: varchar("system_role", { length: 20 }).notNull().default("user"),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const characters = pgTable("characters", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(),
  telegramChatId: varchar("telegram_chat_id", { length: 50 }),
  appearance: jsonb("appearance").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_characters_user_id").on(table.userId),
]);

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  description: varchar("description", { length: 500 }),
  isDefault: boolean("is_default").notNull().default(false),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const channels = pgTable("channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 500 }),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  groupId: uuid("group_id").references(() => groups.id, { onDelete: "set null" }),
  mapData: jsonb("map_data"),
  mapConfig: jsonb("map_config"),
  isPublic: boolean("is_public").default(true),
  inviteCode: varchar("invite_code", { length: 20 }).unique(),
  maxPlayers: integer("max_players").default(50),
  password: varchar("password", { length: 255 }),
  gatewayConfig: jsonb("gateway_config"),
  channelType: varchar("channel_type", { length: 20 }).default("standard"),
  clientName: varchar("client_name", { length: 200 }),
  clientLogo: varchar("client_logo", { length: 500 }),
  parentChannelId: uuid("parent_channel_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const gatewayResources = pgTable("gateway_resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  baseUrl: text("base_url").notNull(),
  tokenEncrypted: text("token_encrypted").notNull(),
  pairedDeviceId: text("paired_device_id"),
  provider: varchar("provider", { length: 20 }).notNull().default("openclaw"),
  workspacePath: text("workspace_path"),
  lastValidatedAt: timestamp("last_validated_at", { withTimezone: true }),
  lastValidationStatus: varchar("last_validation_status", { length: 40 }),
  lastValidationError: text("last_validation_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_gateway_resources_owner_user_id").on(table.ownerUserId),
]);

export const gatewayShares = pgTable("gateway_shares", {
  id: uuid("id").defaultRandom().primaryKey(),
  gatewayId: uuid("gateway_id").notNull().references(() => gatewayResources.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 32 }).notNull().default("use"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_gateway_shares_gateway_id").on(table.gatewayId),
  index("idx_gateway_shares_user_id").on(table.userId),
  uniqueIndex("gateway_shares_gateway_user_idx").on(table.gatewayId, table.userId),
]);

export const channelGatewayBindings = pgTable("channel_gateway_bindings", {
  id: uuid("id").defaultRandom().primaryKey(),
  channelId: uuid("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  gatewayId: uuid("gateway_id").notNull().references(() => gatewayResources.id, { onDelete: "cascade" }),
  boundByUserId: uuid("bound_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  boundAt: timestamp("bound_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_channel_gateway_bindings_gateway_id").on(table.gatewayId),
  uniqueIndex("channel_gateway_bindings_channel_idx").on(table.channelId),
]);

export const groupMembers = pgTable("group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull().default("member"),
  approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_group_members_group_id").on(table.groupId),
  index("idx_group_members_user_id").on(table.userId),
  unique("group_members_group_user_unique").on(table.groupId, table.userId),
]);

export const groupInvites = pgTable("group_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 64 }).unique().notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "set null" }),
  targetLoginId: varchar("target_login_id", { length: 50 }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  acceptedBy: uuid("accepted_by").references(() => users.id, { onDelete: "set null" }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_group_invites_group_id").on(table.groupId),
  index("idx_group_invites_target_user_id").on(table.targetUserId),
]);

export const groupJoinRequests = pgTable("group_join_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  message: text("message"),
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_group_join_requests_group_id").on(table.groupId),
  index("idx_group_join_requests_user_id").on(table.userId),
  unique("group_join_requests_group_user_unique").on(table.groupId, table.userId),
]);

export const groupPermissions = pgTable("group_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  permissionKey: varchar("permission_key", { length: 50 }).notNull(),
  effect: varchar("effect", { length: 10 }).notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_group_permissions_group_id").on(table.groupId),
  unique("group_permissions_group_permission_unique").on(table.groupId, table.permissionKey),
]);

export const userPermissionOverrides = pgTable("user_permission_overrides", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  permissionKey: varchar("permission_key", { length: 50 }).notNull(),
  effect: varchar("effect", { length: 10 }).notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_user_permission_overrides_group_id").on(table.groupId),
  index("idx_user_permission_overrides_user_id").on(table.userId),
  unique("user_permission_overrides_group_user_permission_unique").on(table.groupId, table.userId, table.permissionKey),
]);

export const channelMembers = pgTable("channel_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull().default("member"),
  lastX: integer("last_x"),
  lastY: integer("last_y"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_channel_members_channel_id").on(table.channelId),
  index("idx_channel_members_user_id").on(table.userId),
  unique("channel_members_channel_user_unique").on(table.channelId, table.userId),
]);

// Duplicate removed

// -----------------------------------------------------------------------------
// AI Skills & MCP Severs (Agency Global Library)
// -----------------------------------------------------------------------------

export const mcpServers = pgTable("mcp_servers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  command: varchar("command", { length: 255 }).notNull(),
  args: jsonb("args").default([]),
  envVariables: jsonb("env_variables").default({}),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  instructions: text("instructions").notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const channelMcpServers = pgTable("channel_mcp_servers", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  mcpServerId: uuid("mcp_server_id").notNull().references(() => mcpServers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex("channel_mcp_servers_unique").on(table.channelId, table.mcpServerId),
]);

export const channelSkills = pgTable("channel_skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  skillId: uuid("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex("channel_skills_unique").on(table.channelId, table.skillId),
]);

export const agencyReports = pgTable("agency_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  agentId: varchar("agent_id", { length: 255 }),
  content: text("content").notNull(),
  analysisMode: varchar("analysis_mode", { length: 50 }).default("daily"),
  reportDate: timestamp("report_date", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const channelLibraryItems = pgTable("channel_library_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  layer: varchar("layer", { length: 20 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  content: text("content"),
  metadata: jsonb("metadata"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_channel_library_items_channel_layer").on(table.channelId, table.layer),
  uniqueIndex("channel_library_items_unique").on(table.channelId, table.layer, table.category, table.name),
]);

export const npcLibraryItems = pgTable("npc_library_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  npcId: uuid("npc_id").notNull().references(() => npcs.id, { onDelete: "cascade" }),
  layer: varchar("layer", { length: 40 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  content: text("content"),
  metadata: jsonb("metadata"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_npc_library_items_npc_layer").on(table.npcId, table.layer),
  uniqueIndex("npc_library_items_unique").on(table.npcId, table.layer, table.category, table.name),
]);

export const npcMemoryItems = pgTable("npc_memory_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  npcId: uuid("npc_id").notNull().references(() => npcs.id, { onDelete: "cascade" }),
  memoryType: varchar("memory_type", { length: 40 }).notNull().default("fact"),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  pinned: boolean("pinned").notNull().default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_npc_memory_items_npc_type").on(table.npcId, table.memoryType),
  index("idx_npc_memory_items_npc_created").on(table.npcId, table.createdAt),
]);

export const maps = pgTable("maps", {
  id: varchar("id", { length: 100 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  tilemapPath: varchar("tilemap_path", { length: 500 }).notNull(),
  config: jsonb("config"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const mapPortals = pgTable("map_portals", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromMapId: varchar("from_map_id", { length: 100 }).references(() => maps.id),
  toMapId: varchar("to_map_id", { length: 100 }).references(() => maps.id),
  fromX: integer("from_x").notNull(),
  fromY: integer("from_y").notNull(),
  toX: integer("to_x").notNull(),
  toY: integer("to_y").notNull(),
});

export const mapTemplates = pgTable("map_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  icon: varchar("icon", { length: 10 }).notNull().default("🗺️"),
  description: varchar("description", { length: 500 }),
  cols: integer("cols").notNull(),
  rows: integer("rows").notNull(),
  layers: jsonb("layers"),
  objects: jsonb("objects"),
  tiledJson: jsonb("tiled_json"),
  thumbnail: text("thumbnail"),
  spawnCol: integer("spawn_col").notNull(),
  spawnRow: integer("spawn_row").notNull(),
  tags: varchar("tags", { length: 500 }),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const npcs = pgTable("npcs", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  positionX: integer("position_x").notNull(),
  positionY: integer("position_y").notNull(),
  direction: varchar("direction", { length: 10 }).default("down"),
  appearance: jsonb("appearance").notNull(),
  openclawConfig: jsonb("openclaw_config").notNull(),
  totalTokens: integer("total_tokens").default(0).notNull(),
  reportsToId: uuid("reports_to_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_npcs_channel_id").on(table.channelId),
  index("idx_npcs_reports_to_id").on(table.reportsToId),
  unique("npcs_channel_position_unique").on(table.channelId, table.positionX, table.positionY),
]);

export const npcReports = pgTable("npc_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  npcId: uuid("npc_id").notNull().references(() => npcs.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  targetUserId: uuid("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 20 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  characterId: uuid("character_id").notNull().references(() => characters.id),
  npcId: uuid("npc_id").notNull().references(() => npcs.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 10 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_chat_messages_lookup").on(table.characterId, table.npcId, table.createdAt),
]);

export const meetingMinutes = pgTable("meeting_minutes", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  transcript: text("transcript").notNull(),
  participants: jsonb("participants").notNull().default([]),
  totalTurns: integer("total_turns").notNull().default(0),
  durationSeconds: integer("duration_seconds"),
  initiatorId: uuid("initiator_id").references(() => users.id, { onDelete: "set null" }),
  keyTopics: jsonb("key_topics").notNull().default([]),
  conclusions: text("conclusions"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_meeting_minutes_channel").on(table.channelId),
  index("idx_meeting_minutes_created").on(table.createdAt),
]);

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  channelId: uuid("channel_id").notNull().references(() => channels.id),
  npcId: uuid("npc_id").notNull().references(() => npcs.id, { onDelete: "cascade" }),
  assignerId: uuid("assigner_id").notNull().references(() => characters.id),
  assignerNpcId: uuid("assigner_npc_id"),
  npcTaskId: varchar("npc_task_id", { length: 64 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  summary: text("summary"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  recurrence: varchar("recurrence", { length: 20 }).notNull().default("once"),
  scheduledTime: varchar("scheduled_time", { length: 8 }),
  scheduledDay: integer("scheduled_day"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedBy: uuid("approved_by"),
  autoNudgeCount: integer("auto_nudge_count").notNull().default(0),
  autoNudgeMax: integer("auto_nudge_max").notNull().default(5),
  lastNudgedAt: timestamp("last_nudged_at", { withTimezone: true }),
  lastReportedAt: timestamp("last_reported_at", { withTimezone: true }),
  stalledAt: timestamp("stalled_at", { withTimezone: true }),
  stalledReason: varchar("stalled_reason", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => [
  index("idx_tasks_channel").on(table.channelId),
  index("idx_tasks_npc").on(table.npcId),
  uniqueIndex("idx_tasks_npc_task_id").on(table.npcId, table.npcTaskId),
]);

export const automationJobs = pgTable("automation_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: varchar("type", { length: 80 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  channelId: uuid("channel_id").references(() => channels.id, { onDelete: "cascade" }),
  npcId: uuid("npc_id").references(() => npcs.id, { onDelete: "set null" }),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  approvalRequestId: uuid("approval_request_id"),
  payload: jsonb("payload").notNull().default({}),
  result: jsonb("result"),
  error: text("error"),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  runAfter: timestamp("run_after", { withTimezone: true }),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_automation_jobs_status_run_after").on(table.status, table.runAfter),
  index("idx_automation_jobs_channel").on(table.channelId),
  index("idx_automation_jobs_npc").on(table.npcId),
  index("idx_automation_jobs_created").on(table.createdAt),
]);

export const approvalRequests = pgTable("approval_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  channelId: uuid("channel_id").references(() => channels.id, { onDelete: "cascade" }),
  npcId: uuid("npc_id").references(() => npcs.id, { onDelete: "set null" }),
  requestedByUserId: uuid("requested_by_user_id").references(() => users.id, { onDelete: "set null" }),
  reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, { onDelete: "set null" }),
  actionType: varchar("action_type", { length: 80 }).notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  summary: text("summary"),
  payload: jsonb("payload").notNull().default({}),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  decisionReason: text("decision_reason"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_approval_requests_status").on(table.status),
  index("idx_approval_requests_channel").on(table.channelId),
  index("idx_approval_requests_npc").on(table.npcId),
  index("idx_approval_requests_created").on(table.createdAt),
]);

export const npcActionLogs = pgTable("npc_action_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  channelId: uuid("channel_id").references(() => channels.id, { onDelete: "cascade" }),
  npcId: uuid("npc_id").references(() => npcs.id, { onDelete: "set null" }),
  jobId: uuid("job_id").references(() => automationJobs.id, { onDelete: "set null" }),
  approvalRequestId: uuid("approval_request_id").references(() => approvalRequests.id, { onDelete: "set null" }),
  actionType: varchar("action_type", { length: 80 }).notNull(),
  status: varchar("status", { length: 30 }).notNull(),
  reason: text("reason"),
  input: jsonb("input"),
  output: jsonb("output"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_npc_action_logs_channel_created").on(table.channelId, table.createdAt),
  index("idx_npc_action_logs_npc_created").on(table.npcId, table.createdAt),
  index("idx_npc_action_logs_job").on(table.jobId),
  index("idx_npc_action_logs_status").on(table.status),
]);

export const stamps = pgTable("stamps", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  cols: integer("cols").notNull(),
  rows: integer("rows").notNull(),
  tileWidth: integer("tile_width").notNull().default(32),
  tileHeight: integer("tile_height").notNull().default(32),
  layers: jsonb("layers").notNull(),
  tilesets: jsonb("tilesets").notNull(),
  thumbnail: text("thumbnail"),
  createdBy: uuid("created_by").references(() => users.id),
  builtIn: boolean("built_in").default(false).notNull(),
  tags: text("tags"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const tilesetImages = pgTable("tileset_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  tilewidth: integer("tilewidth").notNull().default(32),
  tileheight: integer("tileheight").notNull().default(32),
  columns: integer("columns").notNull(),
  tilecount: integer("tilecount").notNull(),
  image: text("image").notNull(),
  builtIn: boolean("built_in").default(false).notNull(),
  tags: text("tags"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex("idx_tileset_images_name").on(table.name),
]);

// -----------------------------------------------------------------------------
// Office Intelligence Layer
// -----------------------------------------------------------------------------

export const officeClients = pgTable("office_clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  status: varchar("status", { length: 40 }).notNull().default("active"),
  ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
  summary: text("summary"),
  profileJson: jsonb("profile_json").notNull().default({}),
  brandingConfig: jsonb("branding_config").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("office_clients_channel_unique").on(table.channelId),
  index("idx_office_clients_status").on(table.status),
  index("idx_office_clients_owner").on(table.ownerUserId),
]);

export const officeClientPortals = pgTable("office_client_portals", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => officeClients.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  accessToken: varchar("access_token", { length: 255 }),
  config: jsonb("config").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_office_client_portals_client").on(table.clientId),
]);

export const officeClientTimeline = pgTable("office_client_timeline", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => officeClients.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 240 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull().default("milestone"),
  eventDate: timestamp("event_date", { withTimezone: true }).defaultNow().notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_office_client_timeline_client").on(table.clientId),
  index("idx_office_client_timeline_date").on(table.eventDate),
]);

export const officeSocialMetrics = pgTable("office_social_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => officeClients.id, { onDelete: "cascade" }),
  platform: varchar("platform", { length: 20 }).notNull(), // 'instagram', 'facebook'
  metricName: varchar("metric_name", { length: 80 }).notNull(),
  metricValue: decimal("metric_value", { precision: 20, scale: 2 }).notNull(),
  metricDate: timestamp("metric_date", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_office_social_metrics_client_platform").on(table.clientId, table.platform),
  index("idx_office_social_metrics_date").on(table.metricDate),
]);

export const officeMemories = pgTable("office_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  scope: varchar("scope", { length: 40 }).notNull().default("client"),
  clientId: uuid("client_id").references(() => officeClients.id, { onDelete: "cascade" }),
  channelId: uuid("channel_id").references(() => channels.id, { onDelete: "cascade" }),
  npcId: uuid("npc_id").references(() => npcs.id, { onDelete: "set null" }),
  memoryType: varchar("memory_type", { length: 40 }).notNull().default("fact"),
  title: varchar("title", { length: 240 }).notNull(),
  content: text("content").notNull(),
  importance: integer("importance").notNull().default(3),
  sourceType: varchar("source_type", { length: 80 }),
  sourceId: uuid("source_id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_office_memories_client").on(table.clientId),
  index("idx_office_memories_channel").on(table.channelId),
  index("idx_office_memories_npc").on(table.npcId),
  index("idx_office_memories_importance").on(table.importance),
]);

export const officeNotifications = pgTable("office_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => officeClients.id, { onDelete: "cascade" }),
  channelId: uuid("channel_id").references(() => channels.id, { onDelete: "cascade" }),
  npcId: uuid("npc_id").references(() => npcs.id, { onDelete: "set null" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  type: varchar("type", { length: 80 }).notNull(),
  priority: varchar("priority", { length: 20 }).notNull().default("normal"),
  title: varchar("title", { length: 240 }).notNull(),
  body: text("body"),
  status: varchar("status", { length: 30 }).notNull().default("unread"),
  actionType: varchar("action_type", { length: 80 }),
  actionPayload: jsonb("action_payload").notNull().default({}),
  sourceType: varchar("source_type", { length: 80 }),
  sourceId: uuid("source_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
}, (table) => [
  index("idx_office_notifications_status").on(table.status),
  index("idx_office_notifications_client").on(table.clientId),
  index("idx_office_notifications_channel").on(table.channelId),
  index("idx_office_notifications_created").on(table.createdAt),
]);

export const officeContextSnapshots = pgTable("office_context_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => officeClients.id, { onDelete: "cascade" }),
  channelId: uuid("channel_id").references(() => channels.id, { onDelete: "cascade" }),
  contextKind: varchar("context_kind", { length: 80 }).notNull(),
  summary: text("summary"),
  payload: jsonb("payload").notNull().default({}),
  tokenEstimate: integer("token_estimate").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
}, (table) => [
  index("idx_office_context_client_kind").on(table.clientId, table.contextKind),
  index("idx_office_context_created").on(table.createdAt),
]);

export const officeAgentRuns = pgTable("office_agent_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => officeClients.id, { onDelete: "cascade" }),
  channelId: uuid("channel_id").references(() => channels.id, { onDelete: "cascade" }),
  npcId: uuid("npc_id").references(() => npcs.id, { onDelete: "set null" }),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
  request: jsonb("request").notNull().default({}),
  contextSnapshotId: uuid("context_snapshot_id").references(() => officeContextSnapshots.id, { onDelete: "set null" }),
  output: text("output"),
  status: varchar("status", { length: 30 }).notNull().default("completed"),
  tokensUsed: integer("tokens_used").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_office_agent_runs_client").on(table.clientId),
  index("idx_office_agent_runs_npc").on(table.npcId),
  index("idx_office_agent_runs_created").on(table.createdAt),
]);

// ── Projects ──────────────────────────────────────────────
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  thumbnail: text("thumbnail"),
  tiledJson: jsonb("tiled_json"),
  settings: jsonb("settings"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projectTilesets = pgTable("project_tilesets", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  tilesetId: uuid("tileset_id").notNull().references(() => tilesetImages.id, { onDelete: "cascade" }),
  firstgid: integer("firstgid").notNull(),
  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique("uq_project_tileset").on(t.projectId, t.tilesetId),
]);

export const projectStamps = pgTable("project_stamps", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  stampId: uuid("stamp_id").notNull().references(() => stamps.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique("uq_project_stamp").on(t.projectId, t.stampId),
]);

export const tokenUsageLogs = pgTable("token_usage_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  npcId: uuid("npc_id").notNull().references(() => npcs.id, { onDelete: "cascade" }),
  channelId: uuid("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  promptTokens: integer("prompt_tokens").default(0).notNull(),
  completionTokens: integer("completion_tokens").default(0).notNull(),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 6 }).default("0.000000").notNull(),
  // Accepted values: 'dm' | 'meeting' | 'task' | 'automation' | 'tool' | 'library-context'
  contextKind: varchar("context_kind", { length: 32 }).notNull(),
  model: varchar("model", { length: 64 }),
  // Which provider served the call (openclaw | claude-code | codex | groq | anthropic | openai)
  provider: varchar("provider", { length: 32 }),
  // For 'tool' kind: the name of the tool/MCP invoked
  toolName: varchar("tool_name", { length: 128 }),
  // Groups sub-calls that happened inside a single logical operation (e.g. a task with multiple steps)
  operationId: varchar("operation_id", { length: 64 }),
  // Wall-clock duration of the call in ms (optional, useful for latency tracking)
  durationMs: integer("duration_ms"),
  // Free-form label for the caller (e.g. taskTitle, ruleName) — helps showing in UI
  label: varchar("label", { length: 160 }),
  // Set when usage came from provider's real usage field (vs. char-length estimate)
  isRealUsage: boolean("is_real_usage").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_token_usage_npc").on(table.npcId),
  index("idx_token_usage_channel").on(table.channelId),
  index("idx_token_usage_created").on(table.createdAt),
  index("idx_token_usage_kind").on(table.contextKind),
]);
