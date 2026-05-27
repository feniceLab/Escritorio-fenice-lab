-- Expand token_usage_logs for per-operation breakdown
ALTER TABLE "token_usage_logs" ALTER COLUMN "context_kind" TYPE varchar(32);--> statement-breakpoint
ALTER TABLE "token_usage_logs" ALTER COLUMN "model" TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "token_usage_logs" ADD COLUMN "provider" varchar(32);--> statement-breakpoint
ALTER TABLE "token_usage_logs" ADD COLUMN "tool_name" varchar(128);--> statement-breakpoint
ALTER TABLE "token_usage_logs" ADD COLUMN "operation_id" varchar(64);--> statement-breakpoint
ALTER TABLE "token_usage_logs" ADD COLUMN "duration_ms" integer;--> statement-breakpoint
ALTER TABLE "token_usage_logs" ADD COLUMN "label" varchar(160);--> statement-breakpoint
ALTER TABLE "token_usage_logs" ADD COLUMN "is_real_usage" boolean NOT NULL DEFAULT false;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_token_usage_kind" ON "token_usage_logs" USING btree ("context_kind");
