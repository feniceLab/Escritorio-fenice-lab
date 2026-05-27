CREATE TABLE "office_content_pieces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"caption" text,
	"media_urls" text[] DEFAULT '{}',
	"platform" varchar(20) DEFAULT 'both' NOT NULL,
	"status" varchar(30) DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"revision_note" text,
	"npc_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "office_meta_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"access_token" text NOT NULL,
	"fb_page_id" varchar(50),
	"ig_user_id" varchar(50),
	"token_expires_at" timestamp with time zone,
	"notif_chat_ids" text[] DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_meta_config_client" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "office_publish_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_piece_id" uuid NOT NULL,
	"platform" varchar(10) NOT NULL,
	"external_post_id" varchar(100),
	"status" varchar(20) DEFAULT 'published' NOT NULL,
	"error_message" text,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "office_publish_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_piece_id" uuid NOT NULL,
	"run_at" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"last_error" text,
	"locked_at" timestamp with time zone,
	"locked_by" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "office_telegram_bots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"bot_token" text NOT NULL,
	"purpose" varchar(100),
	"client_id" uuid,
	"default_chat_ids" text[] DEFAULT '{}',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "office_telegram_bots_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "office_content_pieces" ADD CONSTRAINT "office_content_pieces_client_id_office_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."office_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_content_pieces" ADD CONSTRAINT "office_content_pieces_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_content_pieces" ADD CONSTRAINT "office_content_pieces_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_content_pieces" ADD CONSTRAINT "office_content_pieces_npc_id_npcs_id_fk" FOREIGN KEY ("npc_id") REFERENCES "public"."npcs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_meta_config" ADD CONSTRAINT "office_meta_config_client_id_office_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."office_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_publish_history" ADD CONSTRAINT "office_publish_history_content_piece_id_office_content_pieces_id_fk" FOREIGN KEY ("content_piece_id") REFERENCES "public"."office_content_pieces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_publish_queue" ADD CONSTRAINT "office_publish_queue_content_piece_id_office_content_pieces_id_fk" FOREIGN KEY ("content_piece_id") REFERENCES "public"."office_content_pieces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_telegram_bots" ADD CONSTRAINT "office_telegram_bots_client_id_office_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."office_clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_content_pieces_client" ON "office_content_pieces" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_content_pieces_status" ON "office_content_pieces" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_content_pieces_scheduled" ON "office_content_pieces" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_publish_history_piece" ON "office_publish_history" USING btree ("content_piece_id");--> statement-breakpoint
CREATE INDEX "idx_publish_history_published_at" ON "office_publish_history" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_publish_queue_run_at" ON "office_publish_queue" USING btree ("run_at");--> statement-breakpoint
CREATE INDEX "idx_publish_queue_status" ON "office_publish_queue" USING btree ("status");