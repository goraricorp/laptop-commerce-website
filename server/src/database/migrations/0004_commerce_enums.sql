CREATE TYPE "public"."actor_type" AS ENUM('user', 'guest', 'moderator', 'administrator', 'chatbot', 'system');--> statement-breakpoint
CREATE TYPE "public"."address_type" AS ENUM('home', 'office', 'other');--> statement-breakpoint
CREATE TYPE "public"."attribute_display_type" AS ENUM('text', 'color', 'number', 'boolean', 'select');--> statement-breakpoint
CREATE TYPE "public"."cart_status" AS ENUM('active', 'converted', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('open', 'pending', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."conversation_type" AS ENUM('buyer-seller', 'buyer-chatbot', 'support');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."fulfillment_status" AS ENUM('unfulfilled', 'processing', 'shipped', 'delivered', 'returned', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."inventory_location_type" AS ENUM('store', 'warehouse', 'service_center');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."order_address_type" AS ENUM('shipping', 'billing');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'processing', 'completed', 'cancelled', 'returned');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('online', 'cod', 'card', 'bank_transfer', 'wallet');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('momo', 'vnpay', 'paypal', 'cod', 'bank_transfer', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_record_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'pending', 'paid', 'failed', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('laptop', 'component', 'accessory', 'monitor', 'other');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'published', 'rejected', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."sender_type" AS ENUM('user', 'guest', 'moderator', 'administrator', 'chatbot', 'system');--> statement-breakpoint
CREATE TYPE "public"."shipment_status" AS ENUM('pending', 'processing', 'shipped', 'in_transit', 'delivered', 'failed', 'returned');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_type" AS ENUM('receipt', 'issue', 'transfer_in', 'transfer_out', 'adjustment', 'reservation', 'release', 'return');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'moderator', 'administrator', 'master');--> statement-breakpoint
CREATE TYPE "public"."variant_status" AS ENUM('active', 'inactive', 'out_of_stock', 'discontinued');--> statement-breakpoint
ALTER TABLE "address" ALTER COLUMN "type" SET DEFAULT 'home'::"public"."address_type";--> statement-breakpoint
ALTER TABLE "address" ALTER COLUMN "type" SET DATA TYPE "public"."address_type" USING "type"::text::"public"."address_type";--> statement-breakpoint
ALTER TABLE "attribute" ALTER COLUMN "display_type" SET DEFAULT 'text'::"public"."attribute_display_type";--> statement-breakpoint
ALTER TABLE "attribute" ALTER COLUMN "display_type" SET DATA TYPE "public"."attribute_display_type" USING "display_type"::text::"public"."attribute_display_type";--> statement-breakpoint
ALTER TABLE "cart" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."cart_status";--> statement-breakpoint
ALTER TABLE "cart" ALTER COLUMN "status" SET DATA TYPE "public"."cart_status" USING "status"::text::"public"."cart_status";--> statement-breakpoint
ALTER TABLE "conversation_participant" ALTER COLUMN "actor_type" SET DEFAULT 'guest'::"public"."actor_type";--> statement-breakpoint
ALTER TABLE "conversation_participant" ALTER COLUMN "actor_type" SET DATA TYPE "public"."actor_type" USING "actor_type"::text::"public"."actor_type";--> statement-breakpoint
ALTER TABLE "conversation" ALTER COLUMN "type" SET DEFAULT 'support'::"public"."conversation_type";--> statement-breakpoint
ALTER TABLE "conversation" ALTER COLUMN "type" SET DATA TYPE "public"."conversation_type" USING "type"::text::"public"."conversation_type";--> statement-breakpoint
ALTER TABLE "conversation" ALTER COLUMN "status" SET DEFAULT 'open'::"public"."conversation_status";--> statement-breakpoint
ALTER TABLE "conversation" ALTER COLUMN "status" SET DATA TYPE "public"."conversation_status" USING "status"::text::"public"."conversation_status";--> statement-breakpoint
ALTER TABLE "inventory_location" ALTER COLUMN "type" SET DEFAULT 'store'::"public"."inventory_location_type";--> statement-breakpoint
ALTER TABLE "inventory_location" ALTER COLUMN "type" SET DATA TYPE "public"."inventory_location_type" USING "type"::text::"public"."inventory_location_type";--> statement-breakpoint
ALTER TABLE "message" ALTER COLUMN "sender_type" SET DEFAULT 'system'::"public"."sender_type";--> statement-breakpoint
ALTER TABLE "message" ALTER COLUMN "sender_type" SET DATA TYPE "public"."sender_type" USING "sender_type"::text::"public"."sender_type";--> statement-breakpoint
ALTER TABLE "order_address" ALTER COLUMN "type" SET DEFAULT 'shipping'::"public"."order_address_type";--> statement-breakpoint
ALTER TABLE "order_address" ALTER COLUMN "type" SET DATA TYPE "public"."order_address_type" USING "type"::text::"public"."order_address_type";--> statement-breakpoint
ALTER TABLE "order_status_history" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."order_status";--> statement-breakpoint
ALTER TABLE "order_status_history" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::text::"public"."order_status";--> statement-breakpoint
ALTER TABLE "sales_order" ALTER COLUMN "order_status" SET DEFAULT 'pending'::"public"."order_status";--> statement-breakpoint
ALTER TABLE "sales_order" ALTER COLUMN "order_status" SET DATA TYPE "public"."order_status" USING "order_status"::text::"public"."order_status";--> statement-breakpoint
ALTER TABLE "sales_order" ALTER COLUMN "payment_status" SET DEFAULT 'unpaid'::"public"."payment_status";--> statement-breakpoint
ALTER TABLE "sales_order" ALTER COLUMN "payment_status" SET DATA TYPE "public"."payment_status" USING "payment_status"::text::"public"."payment_status";--> statement-breakpoint
ALTER TABLE "sales_order" ALTER COLUMN "fulfillment_status" SET DEFAULT 'unfulfilled'::"public"."fulfillment_status";--> statement-breakpoint
ALTER TABLE "sales_order" ALTER COLUMN "fulfillment_status" SET DATA TYPE "public"."fulfillment_status" USING "fulfillment_status"::text::"public"."fulfillment_status";--> statement-breakpoint
ALTER TABLE "payment" ALTER COLUMN "provider" SET DEFAULT 'other'::"public"."payment_provider";--> statement-breakpoint
ALTER TABLE "payment" ALTER COLUMN "provider" SET DATA TYPE "public"."payment_provider" USING "provider"::text::"public"."payment_provider";--> statement-breakpoint
ALTER TABLE "payment" ALTER COLUMN "method" SET DEFAULT 'online'::"public"."payment_method";--> statement-breakpoint
ALTER TABLE "payment" ALTER COLUMN "method" SET DATA TYPE "public"."payment_method" USING "method"::text::"public"."payment_method";--> statement-breakpoint
ALTER TABLE "payment" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."payment_record_status";--> statement-breakpoint
ALTER TABLE "payment" ALTER COLUMN "status" SET DATA TYPE "public"."payment_record_status" USING "status"::text::"public"."payment_record_status";--> statement-breakpoint
ALTER TABLE "product_media" ALTER COLUMN "media_type" SET DEFAULT 'image'::"public"."media_type";--> statement-breakpoint
ALTER TABLE "product_media" ALTER COLUMN "media_type" SET DATA TYPE "public"."media_type" USING "media_type"::text::"public"."media_type";--> statement-breakpoint
ALTER TABLE "product_review" ALTER COLUMN "status" SET DEFAULT 'published'::"public"."review_status";--> statement-breakpoint
ALTER TABLE "product_review" ALTER COLUMN "status" SET DATA TYPE "public"."review_status" USING "status"::text::"public"."review_status";--> statement-breakpoint
ALTER TABLE "product_variant" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."variant_status";--> statement-breakpoint
ALTER TABLE "product_variant" ALTER COLUMN "status" SET DATA TYPE "public"."variant_status" USING "status"::text::"public"."variant_status";--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."product_status";--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "status" SET DATA TYPE "public"."product_status" USING "status"::text::"public"."product_status";--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "product_type" SET DEFAULT 'other'::"public"."product_type";--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "product_type" SET DATA TYPE "public"."product_type" USING "product_type"::text::"public"."product_type";--> statement-breakpoint
ALTER TABLE "promotion" ALTER COLUMN "discount_type" SET DEFAULT 'fixed'::"public"."discount_type";--> statement-breakpoint
ALTER TABLE "promotion" ALTER COLUMN "discount_type" SET DATA TYPE "public"."discount_type" USING "discount_type"::text::"public"."discount_type";--> statement-breakpoint
ALTER TABLE "shipment" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."shipment_status";--> statement-breakpoint
ALTER TABLE "shipment" ALTER COLUMN "status" SET DATA TYPE "public"."shipment_status" USING "status"::text::"public"."shipment_status";--> statement-breakpoint
ALTER TABLE "stock_movement" ALTER COLUMN "type" SET DEFAULT 'adjustment'::"public"."stock_movement_type";--> statement-breakpoint
ALTER TABLE "stock_movement" ALTER COLUMN "type" SET DATA TYPE "public"."stock_movement_type" USING "type"::text::"public"."stock_movement_type";--> statement-breakpoint
UPDATE "user" SET "role" = 'user' WHERE "role" NOT IN ('user', 'moderator', 'administrator', 'master');--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::text::"public"."user_role";
