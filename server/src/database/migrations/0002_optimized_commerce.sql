CREATE TABLE "attribute_value" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attribute_id" uuid NOT NULL,
	"value" varchar(255) NOT NULL,
	"code" varchar(100),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attribute" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(100) NOT NULL,
	"display_type" varchar(32) DEFAULT 'text' NOT NULL,
	"is_filterable" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "attribute_name_unique" UNIQUE("name"),
	CONSTRAINT "attribute_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "conversation_participant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" uuid,
	"actor_type" varchar(20) NOT NULL,
	"display_name" varchar(255),
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_balance" (
	"location_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity_on_hand" integer DEFAULT 0 NOT NULL,
	"quantity_reserved" integer DEFAULT 0 NOT NULL,
	"reorder_level" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_balance_location_id_variant_id_pk" PRIMARY KEY("location_id","variant_id"),
	CONSTRAINT "inventory_balance_non_negative" CHECK ("inventory_balance"."quantity_on_hand" >= 0 AND "inventory_balance"."quantity_reserved" >= 0 AND "inventory_balance"."quantity_reserved" <= "inventory_balance"."quantity_on_hand")
);
--> statement-breakpoint
CREATE TABLE "inventory_location" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(32) DEFAULT 'store' NOT NULL,
	"address" text,
	"phone" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_location_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "message_attachment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"url" text NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_name" varchar(255),
	"size_bytes" integer
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_user_id" uuid,
	"sender_type" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_address" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"type" varchar(20) DEFAULT 'shipping' NOT NULL,
	"recipient_name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"address_line" text NOT NULL,
	"ward" varchar(255),
	"district" varchar(255) NOT NULL,
	"province" varchar(255) NOT NULL,
	"country" varchar(100) DEFAULT 'Việt Nam' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_order_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"variant_id" uuid,
	"sku" varchar(100) NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"variant_name" varchar(255) NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"total" numeric(14, 2) NOT NULL,
	CONSTRAINT "sales_order_item_quantity_positive" CHECK ("sales_order_item"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"status" varchar(32) NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"user_id" uuid,
	"guest_email" varchar(255),
	"subtotal" numeric(14, 2) NOT NULL,
	"discount_total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"shipping_total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"grand_total" numeric(14, 2) NOT NULL,
	"order_status" varchar(32) DEFAULT 'pending' NOT NULL,
	"payment_status" varchar(32) DEFAULT 'unpaid' NOT NULL,
	"fulfillment_status" varchar(32) DEFAULT 'unfulfilled' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_order_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"method" varchar(50) NOT NULL,
	"transaction_id" varchar(255),
	"amount" numeric(14, 2) NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
CREATE TABLE "product_content_section" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"title" varchar(255),
	"content" text,
	"image_url" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"url" text NOT NULL,
	"media_type" varchar(20) DEFAULT 'image' NOT NULL,
	"alt" varchar(255),
	"position" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"product_id" uuid NOT NULL,
	"order_item_id" uuid,
	"guest_name" varchar(255),
	"title" varchar(255),
	"score" integer NOT NULL,
	"comment" text,
	"status" varchar(20) DEFAULT 'published' NOT NULL,
	"is_verified_purchase" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_review_score_range" CHECK ("product_review"."score" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "product_variant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"barcode" varchar(100),
	"price" numeric(14, 2) NOT NULL,
	"compare_at_price" numeric(14, 2),
	"cost_price" numeric(14, 2),
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"weight_grams" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variant_sku_unique" UNIQUE("sku"),
	CONSTRAINT "product_variant_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "promotion_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promotion_id" uuid NOT NULL,
	"code" varchar(64) NOT NULL,
	"usage_limit" integer,
	"usage_per_user" integer DEFAULT 1 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "promotion_code_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "promotion_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promotion_code_id" uuid NOT NULL,
	"user_id" uuid,
	"order_id" uuid NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"discount_type" varchar(20) NOT NULL,
	"discount_value" numeric(14, 2) NOT NULL,
	"minimum_order_value" numeric(14, 2) DEFAULT '0' NOT NULL,
	"maximum_discount" numeric(14, 2),
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promotion_date_range" CHECK ("promotion"."ends_at" > "promotion"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "shipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"carrier" varchar(100),
	"tracking_number" varchar(255),
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipment_tracking_number_unique" UNIQUE("tracking_number")
);
--> statement-breakpoint
CREATE TABLE "stock_movement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"type" varchar(32) NOT NULL,
	"quantity" integer NOT NULL,
	"reference_type" varchar(50),
	"reference_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_movement_quantity_non_zero" CHECK ("stock_movement"."quantity" <> 0)
);
--> statement-breakpoint
CREATE TABLE "variant_attribute_value" (
	"variant_id" uuid NOT NULL,
	"attribute_value_id" uuid NOT NULL,
	CONSTRAINT "variant_attribute_value_variant_id_attribute_value_id_pk" PRIMARY KEY("variant_id","attribute_value_id")
);
--> statement-breakpoint
ALTER TABLE "accessory" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "color" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "configuration" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "description" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "discount" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bill_detail" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bill" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rating" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "accessory" CASCADE;--> statement-breakpoint
DROP TABLE "color" CASCADE;--> statement-breakpoint
DROP TABLE "configuration" CASCADE;--> statement-breakpoint
DROP TABLE "description" CASCADE;--> statement-breakpoint
DROP TABLE "discount" CASCADE;--> statement-breakpoint
DROP TABLE "bill_detail" CASCADE;--> statement-breakpoint
DROP TABLE "bill" CASCADE;--> statement-breakpoint
DROP TABLE "rating" CASCADE;--> statement-breakpoint
ALTER TABLE "cart" DROP CONSTRAINT IF EXISTS "cart_account_id_unique";--> statement-breakpoint
ALTER TABLE "address" DROP CONSTRAINT IF EXISTS "address_account_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "cart_item" DROP CONSTRAINT IF EXISTS "cart_item_product_id_product_id_fk";
--> statement-breakpoint
ALTER TABLE "cart_item" DROP CONSTRAINT IF EXISTS "cart_item_color_id_color_id_fk";
--> statement-breakpoint
ALTER TABLE "cart_item" DROP CONSTRAINT IF EXISTS "cart_item_configuration_id_configuration_id_fk";
--> statement-breakpoint
ALTER TABLE "cart_item" DROP CONSTRAINT IF EXISTS "cart_item_accessory_id_accessory_id_fk";
--> statement-breakpoint
ALTER TABLE "cart" DROP CONSTRAINT IF EXISTS "cart_account_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "conversation" DROP CONSTRAINT IF EXISTS "conversation_account_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "address" ALTER COLUMN "type" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "address" ALTER COLUMN "type" SET DEFAULT 'home';--> statement-breakpoint
ALTER TABLE "address" ALTER COLUMN "country" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "address" ALTER COLUMN "country" SET DEFAULT 'Việt Nam';--> statement-breakpoint
ALTER TABLE "category" ALTER COLUMN "description" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "category" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "status" SET DATA TYPE varchar(32);--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "status" SET DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "recipient_name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "phone" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "address_line" text NOT NULL;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "ward" varchar(255);--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "province" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "brand" ADD COLUMN "slug" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "brand" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "brand" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "brand" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "brand" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_item" ADD COLUMN "variant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_item" ADD COLUMN "unit_price" numeric(14, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_item" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_item" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "cart" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "cart" ADD COLUMN "guest_token" uuid DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "cart" ADD COLUMN "status" varchar(20) DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "cart" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "cart" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "slug" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "status" varchar(20) DEFAULT 'open' NOT NULL;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "subject" varchar(255);--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "slug" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "product_type" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "attribute_value" ADD CONSTRAINT "attribute_value_attribute_id_attribute_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attribute"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participant" ADD CONSTRAINT "conversation_participant_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participant" ADD CONSTRAINT "conversation_participant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_balance" ADD CONSTRAINT "inventory_balance_location_id_inventory_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_location"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_balance" ADD CONSTRAINT "inventory_balance_variant_id_product_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_attachment" ADD CONSTRAINT "message_attachment_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_sender_user_id_user_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_address" ADD CONSTRAINT "order_address_order_id_sales_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."sales_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_item" ADD CONSTRAINT "sales_order_item_order_id_sales_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."sales_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_item" ADD CONSTRAINT "sales_order_item_variant_id_product_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_sales_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."sales_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_order_id_sales_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."sales_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_content_section" ADD CONSTRAINT "product_content_section_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_variant_id_product_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_review" ADD CONSTRAINT "product_review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_review" ADD CONSTRAINT "product_review_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_review" ADD CONSTRAINT "product_review_order_item_id_sales_order_item_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."sales_order_item"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_code" ADD CONSTRAINT "promotion_code_promotion_id_promotion_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotion"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_usage" ADD CONSTRAINT "promotion_usage_promotion_code_id_promotion_code_id_fk" FOREIGN KEY ("promotion_code_id") REFERENCES "public"."promotion_code"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_usage" ADD CONSTRAINT "promotion_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_usage" ADD CONSTRAINT "promotion_usage_order_id_sales_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."sales_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_order_id_sales_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."sales_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_location_id_inventory_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_location"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_variant_id_product_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_attribute_value" ADD CONSTRAINT "variant_attribute_value_variant_id_product_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_attribute_value" ADD CONSTRAINT "variant_attribute_value_attribute_value_id_attribute_value_id_fk" FOREIGN KEY ("attribute_value_id") REFERENCES "public"."attribute_value"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attribute_value_unique_idx" ON "attribute_value" USING btree ("attribute_id","value");--> statement-breakpoint
CREATE INDEX "attribute_value_attribute_idx" ON "attribute_value" USING btree ("attribute_id");--> statement-breakpoint
CREATE INDEX "conversation_participant_conversation_idx" ON "conversation_participant" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "inventory_balance_variant_idx" ON "inventory_balance" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "message_attachment_message_idx" ON "message_attachment" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "message_conversation_created_idx" ON "message" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "order_address_order_idx" ON "order_address" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "sales_order_item_order_idx" ON "sales_order_item" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_status_history_order_idx" ON "order_status_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "sales_order_user_idx" ON "sales_order" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sales_order_created_idx" ON "sales_order" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payment_order_idx" ON "payment" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "product_content_product_idx" ON "product_content_section" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_media_product_idx" ON "product_media" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_media_variant_idx" ON "product_media" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "product_review_product_idx" ON "product_review" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_variant_product_idx" ON "product_variant" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "promotion_code_promotion_idx" ON "promotion_code" USING btree ("promotion_id");--> statement-breakpoint
CREATE INDEX "promotion_usage_user_idx" ON "promotion_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "shipment_order_idx" ON "shipment" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "stock_movement_location_variant_idx" ON "stock_movement" USING btree ("location_id","variant_id");--> statement-breakpoint
CREATE INDEX "variant_attribute_value_value_idx" ON "variant_attribute_value" USING btree ("attribute_value_id");--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_variant_id_product_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "address_user_idx" ON "address" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cart_item_cart_variant_idx" ON "cart_item" USING btree ("cart_id","variant_id");--> statement-breakpoint
CREATE INDEX "cart_user_idx" ON "cart" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "category_parent_idx" ON "category" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "product_category_idx" ON "product" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_brand_idx" ON "product" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "product_status_idx" ON "product" USING btree ("status");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
ALTER TABLE "address" DROP COLUMN "account_id";--> statement-breakpoint
ALTER TABLE "address" DROP COLUMN "tower";--> statement-breakpoint
ALTER TABLE "address" DROP COLUMN "street";--> statement-breakpoint
ALTER TABLE "address" DROP COLUMN "city";--> statement-breakpoint
ALTER TABLE "address" DROP COLUMN "state";--> statement-breakpoint
ALTER TABLE "brand" DROP COLUMN "logo";--> statement-breakpoint
ALTER TABLE "cart_item" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "cart_item" DROP COLUMN "color_id";--> statement-breakpoint
ALTER TABLE "cart_item" DROP COLUMN "configuration_id";--> statement-breakpoint
ALTER TABLE "cart_item" DROP COLUMN "accessory_id";--> statement-breakpoint
ALTER TABLE "cart" DROP COLUMN "account_id";--> statement-breakpoint
ALTER TABLE "category" DROP COLUMN "image";--> statement-breakpoint
ALTER TABLE "conversation" DROP COLUMN "account_id";--> statement-breakpoint
ALTER TABLE "conversation" DROP COLUMN "message";--> statement-breakpoint
ALTER TABLE "conversation" DROP COLUMN "time";--> statement-breakpoint
ALTER TABLE "product" DROP COLUMN "image";--> statement-breakpoint
ALTER TABLE "product" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "brand" ADD CONSTRAINT "brand_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_guest_token_unique" UNIQUE("guest_token");--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_quantity_positive" CHECK ("cart_item"."quantity" > 0);
