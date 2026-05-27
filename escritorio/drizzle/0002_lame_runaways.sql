CREATE TABLE "channel_library_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"layer" varchar(20) NOT NULL,
	"category" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"content" text,
	"metadata" jsonb,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "token_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"npc_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"estimated_cost" numeric(10, 6) DEFAULT '0.000000' NOT NULL,
	"context_kind" varchar(20) NOT NULL,
	"model" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "channel_type" varchar(20) DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "client_name" varchar(200);--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "client_logo" varchar(500);--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "parent_channel_id" uuid;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "total_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "channel_library_items" ADD CONSTRAINT "channel_library_items_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage_logs" ADD CONSTRAINT "token_usage_logs_npc_id_npcs_id_fk" FOREIGN KEY ("npc_id") REFERENCES "public"."npcs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage_logs" ADD CONSTRAINT "token_usage_logs_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_channel_library_items_channel_layer" ON "channel_library_items" USING btree ("channel_id","layer");--> statement-breakpoint
CREATE UNIQUE INDEX "channel_library_items_unique" ON "channel_library_items" USING btree ("channel_id","layer","category","name");--> statement-breakpoint
CREATE INDEX "idx_token_usage_npc" ON "token_usage_logs" USING btree ("npc_id");--> statement-breakpoint
CREATE INDEX "idx_token_usage_channel" ON "token_usage_logs" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "idx_token_usage_created" ON "token_usage_logs" USING btree ("created_at");