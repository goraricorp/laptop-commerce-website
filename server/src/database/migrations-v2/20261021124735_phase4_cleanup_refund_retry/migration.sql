ALTER TABLE "upload_asset" ADD COLUMN "checked_at" timestamp with time zone;--> statement-breakpoint
DROP INDEX "refund_return_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "refund_return_unique" ON "refund" ("return_id") WHERE "state"<>'failed';