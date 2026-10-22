CREATE TYPE "actor_type" AS ENUM('user', 'guest', 'moderator', 'administrator', 'chatbot', 'system');--> statement-breakpoint
CREATE TYPE "address_type" AS ENUM('home', 'office', 'other');--> statement-breakpoint
CREATE TYPE "attribute_display_type" AS ENUM('text', 'color', 'number', 'boolean', 'select');--> statement-breakpoint
CREATE TYPE "cart_status" AS ENUM('active', 'converted', 'abandoned');--> statement-breakpoint
CREATE TYPE "conversation_status" AS ENUM('open', 'pending', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "conversation_type" AS ENUM('buyer-seller', 'buyer-chatbot', 'support');--> statement-breakpoint
CREATE TYPE "discount_type" AS ENUM('percentage', 'fixed');--> statement-breakpoint
CREATE TYPE "fulfillment_status" AS ENUM('unfulfilled', 'processing', 'shipped', 'delivered', 'returned', 'cancelled');--> statement-breakpoint
CREATE TYPE "inventory_location_type" AS ENUM('store', 'warehouse', 'service_center');--> statement-breakpoint
CREATE TYPE "media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "order_address_type" AS ENUM('shipping', 'billing');--> statement-breakpoint
CREATE TYPE "order_status" AS ENUM('pending', 'confirmed', 'processing', 'completed', 'cancelled', 'returned');--> statement-breakpoint
CREATE TYPE "payment_method" AS ENUM('online', 'cod', 'card', 'bank_transfer', 'wallet');--> statement-breakpoint
CREATE TYPE "payment_provider" AS ENUM('momo', 'vnpay', 'paypal', 'cod', 'bank_transfer', 'other');--> statement-breakpoint
CREATE TYPE "payment_record_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "payment_status" AS ENUM('unpaid', 'pending', 'paid', 'failed', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TYPE "product_status" AS ENUM('draft', 'active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "product_type" AS ENUM('laptop', 'component', 'accessory', 'monitor', 'other');--> statement-breakpoint
CREATE TYPE "review_status" AS ENUM('pending', 'published', 'rejected', 'hidden');--> statement-breakpoint
CREATE TYPE "sender_type" AS ENUM('user', 'guest', 'moderator', 'administrator', 'chatbot', 'system');--> statement-breakpoint
CREATE TYPE "shipment_status" AS ENUM('pending', 'processing', 'shipped', 'in_transit', 'delivered', 'failed', 'returned');--> statement-breakpoint
CREATE TYPE "stock_movement_type" AS ENUM('receipt', 'issue', 'transfer_in', 'transfer_out', 'adjustment', 'reservation', 'release', 'return');--> statement-breakpoint
CREATE TYPE "user_role" AS ENUM('user', 'moderator', 'administrator', 'master');--> statement-breakpoint
CREATE TYPE "variant_status" AS ENUM('active', 'inactive', 'out_of_stock', 'discontinued');--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "address" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid,
	"recipient_name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"type" "address_type" DEFAULT 'home'::"address_type" NOT NULL,
	"address_line" text NOT NULL,
	"ward" varchar(255),
	"district" varchar(255) NOT NULL,
	"province" varchar(255) NOT NULL,
	"country" varchar(100) DEFAULT 'Việt Nam' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attribute_value" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"attribute_id" uuid NOT NULL,
	"value" varchar(255) NOT NULL,
	"code" varchar(100),
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attribute" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL UNIQUE,
	"code" varchar(100) NOT NULL UNIQUE,
	"display_type" "attribute_display_type" DEFAULT 'text'::"attribute_display_type" NOT NULL,
	"is_filterable" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"slug" varchar(255) NOT NULL UNIQUE,
	"logo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"cart_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(14,2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cart_item_quantity_positive" CHECK ("quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "cart" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid,
	"guest_token" uuid DEFAULT gen_random_uuid() UNIQUE,
	"status" "cart_status" DEFAULT 'active'::"cart_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"parent_id" uuid,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL UNIQUE,
	"description" text,
	"image_url" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_participant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"conversation_id" uuid NOT NULL,
	"user_id" uuid,
	"actor_type" "actor_type" DEFAULT 'guest'::"actor_type" NOT NULL,
	"display_name" varchar(255),
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"type" "conversation_type" DEFAULT 'support'::"conversation_type" NOT NULL,
	"status" "conversation_status" DEFAULT 'open'::"conversation_status" NOT NULL,
	"subject" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_balance" (
	"location_id" uuid,
	"variant_id" uuid,
	"quantity_on_hand" integer DEFAULT 0 NOT NULL,
	"quantity_reserved" integer DEFAULT 0 NOT NULL,
	"reorder_level" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_balance_pkey" PRIMARY KEY("location_id","variant_id"),
	CONSTRAINT "inventory_balance_non_negative" CHECK ("quantity_on_hand" >= 0 AND "quantity_reserved" >= 0 AND "quantity_reserved" <= "quantity_on_hand")
);
--> statement-breakpoint
CREATE TABLE "inventory_location" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(50) NOT NULL UNIQUE,
	"name" varchar(255) NOT NULL,
	"type" "inventory_location_type" DEFAULT 'store'::"inventory_location_type" NOT NULL,
	"address" text,
	"phone" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_attachment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"message_id" uuid NOT NULL,
	"url" text NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_name" varchar(255),
	"size_bytes" integer
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"conversation_id" uuid NOT NULL,
	"sender_user_id" uuid,
	"sender_type" "sender_type" DEFAULT 'system'::"sender_type" NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_address" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"type" "order_address_type" DEFAULT 'shipping'::"order_address_type" NOT NULL,
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
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"variant_id" uuid,
	"sku" varchar(100) NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"variant_name" varchar(255) NOT NULL,
	"unit_price" numeric(14,2) NOT NULL,
	"quantity" integer NOT NULL,
	"total" numeric(14,2) NOT NULL,
	CONSTRAINT "sales_order_item_quantity_positive" CHECK ("quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'pending'::"order_status" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(50) NOT NULL UNIQUE,
	"user_id" uuid,
	"guest_email" varchar(255),
	"subtotal" numeric(14,2) NOT NULL,
	"discount_total" numeric(14,2) DEFAULT '0' NOT NULL,
	"shipping_total" numeric(14,2) DEFAULT '0' NOT NULL,
	"grand_total" numeric(14,2) NOT NULL,
	"order_status" "order_status" DEFAULT 'pending'::"order_status" NOT NULL,
	"payment_status" "payment_status" DEFAULT 'unpaid'::"payment_status" NOT NULL,
	"fulfillment_status" "fulfillment_status" DEFAULT 'unfulfilled'::"fulfillment_status" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"provider" "payment_provider" DEFAULT 'other'::"payment_provider" NOT NULL,
	"method" "payment_method" DEFAULT 'online'::"payment_method" NOT NULL,
	"transaction_id" varchar(255) UNIQUE,
	"amount" numeric(14,2) NOT NULL,
	"status" "payment_record_status" DEFAULT 'pending'::"payment_record_status" NOT NULL,
	"paid_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_content_section" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"product_id" uuid NOT NULL,
	"title" varchar(255),
	"content" text,
	"image_url" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"url" text NOT NULL,
	"media_type" "media_type" DEFAULT 'image'::"media_type" NOT NULL,
	"alt" varchar(255),
	"position" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid,
	"product_id" uuid NOT NULL,
	"order_item_id" uuid,
	"guest_name" varchar(255),
	"title" varchar(255),
	"score" integer NOT NULL,
	"comment" text,
	"status" "review_status" DEFAULT 'published'::"review_status" NOT NULL,
	"is_verified_purchase" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_review_score_range" CHECK ("score" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "product_variant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"product_id" uuid NOT NULL,
	"sku" varchar(100) NOT NULL UNIQUE,
	"name" varchar(255) NOT NULL,
	"barcode" varchar(100) UNIQUE,
	"price" numeric(14,2) NOT NULL,
	"compare_at_price" numeric(14,2),
	"cost_price" numeric(14,2),
	"status" "variant_status" DEFAULT 'active'::"variant_status" NOT NULL,
	"weight_grams" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"category_id" uuid,
	"brand_id" uuid,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL UNIQUE,
	"summary" text,
	"status" "product_status" DEFAULT 'active'::"product_status" NOT NULL,
	"product_type" "product_type" DEFAULT 'other'::"product_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotion_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"promotion_id" uuid NOT NULL,
	"code" varchar(64) NOT NULL UNIQUE,
	"usage_limit" integer,
	"usage_per_user" integer DEFAULT 1 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotion_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"promotion_code_id" uuid NOT NULL,
	"user_id" uuid,
	"order_id" uuid NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"discount_type" "discount_type" DEFAULT 'fixed'::"discount_type" NOT NULL,
	"discount_value" numeric(14,2) NOT NULL,
	"minimum_order_value" numeric(14,2) DEFAULT '0' NOT NULL,
	"maximum_discount" numeric(14,2),
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promotion_date_range" CHECK ("ends_at" > "starts_at")
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"key" text NOT NULL UNIQUE,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"impersonated_by" text
);
--> statement-breakpoint
CREATE TABLE "shipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"carrier" varchar(100),
	"tracking_number" varchar(255) UNIQUE,
	"status" "shipment_status" DEFAULT 'pending'::"shipment_status" NOT NULL,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"location_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"type" "stock_movement_type" DEFAULT 'adjustment'::"stock_movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"reference_type" varchar(50),
	"reference_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_movement_quantity_non_zero" CHECK ("quantity" <> 0)
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"username" text UNIQUE,
	"display_username" text,
	"role" "user_role" DEFAULT 'user'::"user_role" NOT NULL,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp with time zone,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"birthday" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "variant_attribute_value" (
	"variant_id" uuid,
	"attribute_value_id" uuid,
	CONSTRAINT "variant_attribute_value_pkey" PRIMARY KEY("variant_id","attribute_value_id")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "address_user_idx" ON "address" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attribute_value_unique_idx" ON "attribute_value" ("attribute_id","value");--> statement-breakpoint
CREATE INDEX "attribute_value_attribute_idx" ON "attribute_value" ("attribute_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cart_item_cart_variant_idx" ON "cart_item" ("cart_id","variant_id");--> statement-breakpoint
CREATE INDEX "cart_user_idx" ON "cart" ("user_id");--> statement-breakpoint
CREATE INDEX "category_parent_idx" ON "category" ("parent_id");--> statement-breakpoint
CREATE INDEX "conversation_participant_conversation_idx" ON "conversation_participant" ("conversation_id");--> statement-breakpoint
CREATE INDEX "inventory_balance_variant_idx" ON "inventory_balance" ("variant_id");--> statement-breakpoint
CREATE INDEX "message_attachment_message_idx" ON "message_attachment" ("message_id");--> statement-breakpoint
CREATE INDEX "message_conversation_created_idx" ON "message" ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "order_address_order_idx" ON "order_address" ("order_id");--> statement-breakpoint
CREATE INDEX "sales_order_item_order_idx" ON "sales_order_item" ("order_id");--> statement-breakpoint
CREATE INDEX "order_status_history_order_idx" ON "order_status_history" ("order_id");--> statement-breakpoint
CREATE INDEX "sales_order_user_idx" ON "sales_order" ("user_id");--> statement-breakpoint
CREATE INDEX "sales_order_created_idx" ON "sales_order" ("created_at");--> statement-breakpoint
CREATE INDEX "payment_order_idx" ON "payment" ("order_id");--> statement-breakpoint
CREATE INDEX "product_content_product_idx" ON "product_content_section" ("product_id");--> statement-breakpoint
CREATE INDEX "product_media_product_idx" ON "product_media" ("product_id");--> statement-breakpoint
CREATE INDEX "product_media_variant_idx" ON "product_media" ("variant_id");--> statement-breakpoint
CREATE INDEX "product_review_product_idx" ON "product_review" ("product_id");--> statement-breakpoint
CREATE INDEX "product_variant_product_idx" ON "product_variant" ("product_id");--> statement-breakpoint
CREATE INDEX "product_category_idx" ON "product" ("category_id");--> statement-breakpoint
CREATE INDEX "product_brand_idx" ON "product" ("brand_id");--> statement-breakpoint
CREATE INDEX "product_status_idx" ON "product" ("status");--> statement-breakpoint
CREATE INDEX "promotion_code_promotion_idx" ON "promotion_code" ("promotion_id");--> statement-breakpoint
CREATE INDEX "promotion_usage_user_idx" ON "promotion_usage" ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "shipment_order_idx" ON "shipment" ("order_id");--> statement-breakpoint
CREATE INDEX "stock_movement_location_variant_idx" ON "stock_movement" ("location_id","variant_id");--> statement-breakpoint
CREATE INDEX "variant_attribute_value_value_idx" ON "variant_attribute_value" ("attribute_value_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "attribute_value" ADD CONSTRAINT "attribute_value_attribute_id_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attribute"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_cart_id_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_variant_id_product_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_parent_id_fk" FOREIGN KEY ("parent_id") REFERENCES "category"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "conversation_participant" ADD CONSTRAINT "conversation_participant_conversation_id_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conversation_participant" ADD CONSTRAINT "conversation_participant_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "inventory_balance" ADD CONSTRAINT "inventory_balance_location_id_inventory_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "inventory_location"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "inventory_balance" ADD CONSTRAINT "inventory_balance_variant_id_product_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "message_attachment" ADD CONSTRAINT "message_attachment_message_id_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "message"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_sender_user_id_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "order_address" ADD CONSTRAINT "order_address_order_id_sales_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_order"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_order_item" ADD CONSTRAINT "sales_order_item_order_id_sales_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_order"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_order_item" ADD CONSTRAINT "sales_order_item_variant_id_product_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_sales_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_order"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_order_id_sales_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_order"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_content_section" ADD CONSTRAINT "product_content_section_product_id_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_variant_id_product_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_review" ADD CONSTRAINT "product_review_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "product_review" ADD CONSTRAINT "product_review_product_id_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_review" ADD CONSTRAINT "product_review_order_item_id_sales_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "sales_order_item"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_product_id_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_brand_id_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "promotion_code" ADD CONSTRAINT "promotion_code_promotion_id_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotion"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "promotion_usage" ADD CONSTRAINT "promotion_usage_promotion_code_id_promotion_code_id_fkey" FOREIGN KEY ("promotion_code_id") REFERENCES "promotion_code"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "promotion_usage" ADD CONSTRAINT "promotion_usage_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "promotion_usage" ADD CONSTRAINT "promotion_usage_order_id_sales_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_order"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_order_id_sales_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_order"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_location_id_inventory_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "inventory_location"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_variant_id_product_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "variant_attribute_value" ADD CONSTRAINT "variant_attribute_value_variant_id_product_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "variant_attribute_value" ADD CONSTRAINT "variant_attribute_value_cFSiVLGTj5le_fkey" FOREIGN KEY ("attribute_value_id") REFERENCES "attribute_value"("id") ON DELETE CASCADE;