CREATE TABLE "http_session" (
	"sid" text PRIMARY KEY,
	"data" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "http_session_expires_idx" ON "http_session" ("expires_at");