CREATE TABLE "approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid,
	"npc_id" uuid,
	"requested_by_user_id" uuid,
	"reviewed_by_user_id" uuid,
	"action_type" varchar(80) NOT NULL,
	"title" varchar(240) NOT NULL,
	"summary" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"decision_reason" text,
	"reviewed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(80) NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"channel_id" uuid,
	"npc_id" uuid,
	"created_by_user_id" uuid,
	"approval_request_id" uuid,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"run_after" timestamp with time zone,
	"locked_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "npc_action_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid,
	"npc_id" uuid,
	"job_id" uuid,
	"approval_request_id" uuid,
	"action_type" varchar(80) NOT NULL,
	"status" varchar(30) NOT NULL,
	"reason" text,
	"input" jsonb,
	"output" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "npc_library_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"npc_id" uuid NOT NULL,
	"layer" varchar(40) NOT NULL,
	"category" varchar(80) NOT NULL,
	"name" varchar(200) NOT NULL,
	"content" text,
	"metadata" jsonb,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "npc_memory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"npc_id" uuid NOT NULL,
	"memory_type" varchar(40) DEFAULT 'fact' NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"pinned" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "office_agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"channel_id" uuid,
	"npc_id" uuid,
	"task_id" uuid,
	"request" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"context_snapshot_id" uuid,
	"output" text,
	"status" varchar(30) DEFAULT 'completed' NOT NULL,
	"tokens_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "office_client_portals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"slug" varchar(100) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"access_token" varchar(255),
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "office_client_portals_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "office_client_timeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"title" varchar(240) NOT NULL,
	"description" text,
	"category" varchar(50) DEFAULT 'milestone' NOT NULL,
	"event_date" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "office_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"status" varchar(40) DEFAULT 'active' NOT NULL,
	"owner_user_id" uuid,
	"summary" text,
	"profile_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"branding_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "office_context_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"channel_id" uuid,
	"context_kind" varchar(80) NOT NULL,
	"summary" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"token_estimate" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "office_memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" varchar(40) DEFAULT 'client' NOT NULL,
	"client_id" uuid,
	"channel_id" uuid,
	"npc_id" uuid,
	"memory_type" varchar(40) DEFAULT 'fact' NOT NULL,
	"title" varchar(240) NOT NULL,
	"content" text NOT NULL,
	"importance" integer DEFAULT 3 NOT NULL,
	"source_type" varchar(80),
	"source_id" uuid,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "office_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"channel_id" uuid,
	"npc_id" uuid,
	"user_id" uuid,
	"type" varchar(80) NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"title" varchar(240) NOT NULL,
	"body" text,
	"status" varchar(30) DEFAULT 'unread' NOT NULL,
	"action_type" varchar(80),
	"action_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_type" varchar(80),
	"source_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "office_social_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"platform" varchar(20) NOT NULL,
	"metric_name" varchar(80) NOT NULL,
	"metric_value" numeric(20, 2) NOT NULL,
	"metric_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "token_usage_logs" ALTER COLUMN "context_kind" SET DATA TYPE varchar(32);--> statement-breakpoint
ALTER TABLE "token_usage_logs" ALTER COLUMN "model" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "telegram_chat_id" varchar(50);--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "reports_to_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "assigner_npc_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "recurrence" varchar(20) DEFAULT 'once' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "scheduled_time" varchar(8);--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "scheduled_day" integer;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "due_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "requires_approval" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "approved_by" uuid;--> statement-breakpoint
ALTER TABLE "token_usage_logs" ADD COLUMN "provider" varchar(32);--> statement-breakpoint
ALTER TABLE "token_usage_logs" ADD COLUMN "tool_name" varchar(128);--> statement-breakpoint
ALTER TABLE "token_usage_logs" ADD COLUMN "operation_id" varchar(64);--> statement-breakpoint
ALTER TABLE "token_usage_logs" ADD COLUMN "duration_ms" integer;--> statement-breakpoint
ALTER TABLE "token_usage_logs" ADD COLUMN "label" varchar(160);--> statement-breakpoint
ALTER TABLE "token_usage_logs" ADD COLUMN "is_real_usage" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_npc_id_npcs_id_fk" FOREIGN KEY ("npc_id") REFERENCES "public"."npcs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_jobs" ADD CONSTRAINT "automation_jobs_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_jobs" ADD CONSTRAINT "automation_jobs_npc_id_npcs_id_fk" FOREIGN KEY ("npc_id") REFERENCES "public"."npcs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_jobs" ADD CONSTRAINT "automation_jobs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "npc_action_logs" ADD CONSTRAINT "npc_action_logs_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "npc_action_logs" ADD CONSTRAINT "npc_action_logs_npc_id_npcs_id_fk" FOREIGN KEY ("npc_id") REFERENCES "public"."npcs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "npc_action_logs" ADD CONSTRAINT "npc_action_logs_job_id_automation_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."automation_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "npc_action_logs" ADD CONSTRAINT "npc_action_logs_approval_request_id_approval_requests_id_fk" FOREIGN KEY ("approval_request_id") REFERENCES "public"."approval_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "npc_library_items" ADD CONSTRAINT "npc_library_items_npc_id_npcs_id_fk" FOREIGN KEY ("npc_id") REFERENCES "public"."npcs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "npc_memory_items" ADD CONSTRAINT "npc_memory_items_npc_id_npcs_id_fk" FOREIGN KEY ("npc_id") REFERENCES "public"."npcs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_agent_runs" ADD CONSTRAINT "office_agent_runs_client_id_office_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."office_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_agent_runs" ADD CONSTRAINT "office_agent_runs_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_agent_runs" ADD CONSTRAINT "office_agent_runs_npc_id_npcs_id_fk" FOREIGN KEY ("npc_id") REFERENCES "public"."npcs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_agent_runs" ADD CONSTRAINT "office_agent_runs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_agent_runs" ADD CONSTRAINT "office_agent_runs_context_snapshot_id_office_context_snapshots_id_fk" FOREIGN KEY ("context_snapshot_id") REFERENCES "public"."office_context_snapshots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_client_portals" ADD CONSTRAINT "office_client_portals_client_id_office_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."office_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_client_timeline" ADD CONSTRAINT "office_client_timeline_client_id_office_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."office_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_clients" ADD CONSTRAINT "office_clients_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_clients" ADD CONSTRAINT "office_clients_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_context_snapshots" ADD CONSTRAINT "office_context_snapshots_client_id_office_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."office_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_context_snapshots" ADD CONSTRAINT "office_context_snapshots_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_memories" ADD CONSTRAINT "office_memories_client_id_office_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."office_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_memories" ADD CONSTRAINT "office_memories_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_memories" ADD CONSTRAINT "office_memories_npc_id_npcs_id_fk" FOREIGN KEY ("npc_id") REFERENCES "public"."npcs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_notifications" ADD CONSTRAINT "office_notifications_client_id_office_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."office_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_notifications" ADD CONSTRAINT "office_notifications_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_notifications" ADD CONSTRAINT "office_notifications_npc_id_npcs_id_fk" FOREIGN KEY ("npc_id") REFERENCES "public"."npcs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_notifications" ADD CONSTRAINT "office_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_social_metrics" ADD CONSTRAINT "office_social_metrics_client_id_office_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."office_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_approval_requests_status" ON "approval_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_approval_requests_channel" ON "approval_requests" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "idx_approval_requests_npc" ON "approval_requests" USING btree ("npc_id");--> statement-breakpoint
CREATE INDEX "idx_approval_requests_created" ON "approval_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_automation_jobs_status_run_after" ON "automation_jobs" USING btree ("status","run_after");--> statement-breakpoint
CREATE INDEX "idx_automation_jobs_channel" ON "automation_jobs" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "idx_automation_jobs_npc" ON "automation_jobs" USING btree ("npc_id");--> statement-breakpoint
CREATE INDEX "idx_automation_jobs_created" ON "automation_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_npc_action_logs_channel_created" ON "npc_action_logs" USING btree ("channel_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_npc_action_logs_npc_created" ON "npc_action_logs" USING btree ("npc_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_npc_action_logs_job" ON "npc_action_logs" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_npc_action_logs_status" ON "npc_action_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_npc_library_items_npc_layer" ON "npc_library_items" USING btree ("npc_id","layer");--> statement-breakpoint
CREATE UNIQUE INDEX "npc_library_items_unique" ON "npc_library_items" USING btree ("npc_id","layer","category","name");--> statement-breakpoint
CREATE INDEX "idx_npc_memory_items_npc_type" ON "npc_memory_items" USING btree ("npc_id","memory_type");--> statement-breakpoint
CREATE INDEX "idx_npc_memory_items_npc_created" ON "npc_memory_items" USING btree ("npc_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_office_agent_runs_client" ON "office_agent_runs" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_office_agent_runs_npc" ON "office_agent_runs" USING btree ("npc_id");--> statement-breakpoint
CREATE INDEX "idx_office_agent_runs_created" ON "office_agent_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_office_client_portals_client" ON "office_client_portals" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_office_client_timeline_client" ON "office_client_timeline" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_office_client_timeline_date" ON "office_client_timeline" USING btree ("event_date");--> statement-breakpoint
CREATE UNIQUE INDEX "office_clients_channel_unique" ON "office_clients" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "idx_office_clients_status" ON "office_clients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_office_clients_owner" ON "office_clients" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "idx_office_context_client_kind" ON "office_context_snapshots" USING btree ("client_id","context_kind");--> statement-breakpoint
CREATE INDEX "idx_office_context_created" ON "office_context_snapshots" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_office_memories_client" ON "office_memories" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_office_memories_channel" ON "office_memories" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "idx_office_memories_npc" ON "office_memories" USING btree ("npc_id");--> statement-breakpoint
CREATE INDEX "idx_office_memories_importance" ON "office_memories" USING btree ("importance");--> statement-breakpoint
CREATE INDEX "idx_office_notifications_status" ON "office_notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_office_notifications_client" ON "office_notifications" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_office_notifications_channel" ON "office_notifications" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "idx_office_notifications_created" ON "office_notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_office_social_metrics_client_platform" ON "office_social_metrics" USING btree ("client_id","platform");--> statement-breakpoint
CREATE INDEX "idx_office_social_metrics_date" ON "office_social_metrics" USING btree ("metric_date");--> statement-breakpoint
CREATE INDEX "idx_npcs_reports_to_id" ON "npcs" USING btree ("reports_to_id");--> statement-breakpoint
CREATE INDEX "idx_token_usage_kind" ON "token_usage_logs" USING btree ("context_kind");