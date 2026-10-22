CREATE UNIQUE INDEX "account_provider_subject_unique" ON "account" ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "sales_order_owner_cursor_idx" ON "sales_order" ("user_id","created_at","id");--> statement-breakpoint
CREATE INDEX "sales_order_cursor_idx" ON "sales_order" ("created_at","id");