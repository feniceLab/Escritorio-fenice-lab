ALTER TABLE "npcs" ADD COLUMN "reports_to_id" uuid;--> statement-breakpoint
CREATE INDEX "idx_npcs_reports_to_id" ON "npcs" USING btree ("reports_to_id");
