ALTER TYPE "payment_provider" ADD VALUE 'zalopay' BEFORE 'vnpay';--> statement-breakpoint
ALTER TYPE "payment_provider" ADD VALUE 'stripe' BEFORE 'cod';--> statement-breakpoint
CREATE TABLE "checkout_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"request_key" uuid NOT NULL,
	"fingerprint" text NOT NULL,
	"order_id" uuid NOT NULL UNIQUE,
	"provider" varchar(20) NOT NULL,
	"provider_order_id" text UNIQUE,
	"provider_amount" numeric(14,2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"exchange_rate" numeric(14,4),
	"state" varchar(30) DEFAULT 'created' NOT NULL,
	"payment_url" text,
	"reservations" jsonb DEFAULT '[]' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_session_user_request_idx" ON "checkout_session" ("user_id","request_key");--> statement-breakpoint
CREATE INDEX "checkout_session_state_expiry_idx" ON "checkout_session" ("state","expires_at");--> statement-breakpoint
ALTER TABLE "checkout_session" ADD CONSTRAINT "checkout_session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "checkout_session" ADD CONSTRAINT "checkout_session_order_id_sales_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_order"("id") ON DELETE CASCADE;