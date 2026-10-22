CREATE TABLE "storefront_campaign" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" varchar(255) NOT NULL,
	"description" text,
	"image_url" text NOT NULL,
	"product_id" uuid,
	"promotion_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_dates" CHECK ("ends_at" > "starts_at")
);
--> statement-breakpoint
ALTER TABLE "product_content_section" ADD COLUMN "format" varchar(10) DEFAULT 'plain' NOT NULL;--> statement-breakpoint
CREATE INDEX "campaign_active_dates_idx" ON "storefront_campaign" ("is_active","starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "sales_order_spotlight_idx" ON "sales_order" ("order_status","payment_status","updated_at");--> statement-breakpoint
CREATE INDEX "product_content_order_idx" ON "product_content_section" ("product_id","position","id");--> statement-breakpoint
CREATE INDEX "variant_active_price_idx" ON "product_variant" ("status","price","product_id","id");--> statement-breakpoint
ALTER TABLE "storefront_campaign" ADD CONSTRAINT "storefront_campaign_product_id_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "storefront_campaign" ADD CONSTRAINT "storefront_campaign_promotion_id_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotion"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "product_content_section" ADD CONSTRAINT "product_content_format" CHECK ("format" in ('plain','html'));