CREATE TABLE "fulfillment_command" (
	"id" uuid PRIMARY KEY,
	"order_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"hash" text NOT NULL,
	"result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_lease" (
	"name" text PRIMARY KEY,
	"token" uuid,
	"lease_until" timestamp with time zone,
	"last_started_at" timestamp with time zone,
	"last_finished_at" timestamp with time zone,
	"last_error" text,
	"result" jsonb
);
--> statement-breakpoint
CREATE TABLE "order_allocation" (
	"order_item_id" uuid PRIMARY KEY,
	"order_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"gross" bigint NOT NULL,
	"discount" bigint NOT NULL,
	"net" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_fulfillment" (
	"order_id" uuid PRIMARY KEY,
	"stock_issued_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"provenance" text DEFAULT 'command' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"key" text NOT NULL UNIQUE,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"state" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_until" timestamp with time zone,
	"lease_token" uuid,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refund_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"refund_id" uuid NOT NULL,
	"action" text NOT NULL,
	"state" text NOT NULL,
	"code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refund" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"return_id" uuid,
	"payment_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"reason" text NOT NULL,
	"amount" bigint NOT NULL,
	"shipping_amount" bigint DEFAULT 0 NOT NULL,
	"provider" text NOT NULL,
	"currency" text NOT NULL,
	"provider_amount" numeric(14,2) NOT NULL,
	"reference" text NOT NULL UNIQUE,
	"provider_refund_id" text,
	"state" text DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp with time zone,
	"proof" text,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refund_state_check" CHECK ("state" in ('pending','processing','succeeded','failed','needs_review')),
	CONSTRAINT "refund_amount_check" CHECK ("amount">0 and "shipping_amount" between 0 and "amount")
);
--> statement-breakpoint
CREATE TABLE "sales_return_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"return_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"command_id" uuid NOT NULL UNIQUE,
	"status" text NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_return_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"return_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"units" jsonb NOT NULL,
	"quantity" integer NOT NULL,
	"accepted_quantity" integer,
	"restock_quantity" integer,
	"location_id" uuid,
	"condition" text,
	"note" text,
	"refund_amount" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "sales_return_item_quantities" CHECK ("quantity">0 and ("accepted_quantity" is null or "accepted_quantity" between 0 and "quantity") and ("restock_quantity" is null or "restock_quantity" between 0 and "accepted_quantity"))
);
--> statement-breakpoint
CREATE TABLE "sales_return" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"user_id" uuid,
	"status" text DEFAULT 'requested' NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_return_status_check" CHECK ("status" in ('requested','approved','rejected','received','inspected','completed'))
);
--> statement-breakpoint
CREATE TABLE "shipment_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"shipment_id" uuid,
	"actor_id" uuid,
	"command_id" uuid NOT NULL UNIQUE,
	"type" text NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_inbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"reference" text NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "outbox_work_idx" ON "outbox" ("state","available_at");--> statement-breakpoint
CREATE INDEX "refund_order_idx" ON "refund" ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "refund_return_unique" ON "refund" ("return_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_return_item_unique" ON "sales_return_item" ("return_id","order_item_id");--> statement-breakpoint
CREATE INDEX "sales_return_order_idx" ON "sales_return" ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_inbox_provider_event_unique" ON "webhook_inbox" ("provider","event_id");--> statement-breakpoint
ALTER TABLE "fulfillment_command" ADD CONSTRAINT "fulfillment_command_order_id_sales_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_order"("id");--> statement-breakpoint
ALTER TABLE "fulfillment_command" ADD CONSTRAINT "fulfillment_command_actor_id_user_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "order_allocation" ADD CONSTRAINT "order_allocation_order_item_id_sales_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "sales_order_item"("id");--> statement-breakpoint
ALTER TABLE "order_allocation" ADD CONSTRAINT "order_allocation_order_id_sales_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_order"("id");--> statement-breakpoint
ALTER TABLE "order_fulfillment" ADD CONSTRAINT "order_fulfillment_order_id_sales_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_order"("id");--> statement-breakpoint
ALTER TABLE "refund_attempt" ADD CONSTRAINT "refund_attempt_refund_id_refund_id_fkey" FOREIGN KEY ("refund_id") REFERENCES "refund"("id");--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_order_id_sales_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_order"("id");--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_return_id_sales_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "sales_return"("id");--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_payment_id_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment"("id");--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_actor_id_user_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "sales_return_event" ADD CONSTRAINT "sales_return_event_return_id_sales_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "sales_return"("id");--> statement-breakpoint
ALTER TABLE "sales_return_event" ADD CONSTRAINT "sales_return_event_actor_id_user_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "sales_return_event" ADD CONSTRAINT "sales_return_event_command_id_fulfillment_command_id_fkey" FOREIGN KEY ("command_id") REFERENCES "fulfillment_command"("id");--> statement-breakpoint
ALTER TABLE "sales_return_item" ADD CONSTRAINT "sales_return_item_return_id_sales_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "sales_return"("id");--> statement-breakpoint
ALTER TABLE "sales_return_item" ADD CONSTRAINT "sales_return_item_order_item_id_sales_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "sales_order_item"("id");--> statement-breakpoint
ALTER TABLE "sales_return_item" ADD CONSTRAINT "sales_return_item_location_id_inventory_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "inventory_location"("id");--> statement-breakpoint
ALTER TABLE "sales_return" ADD CONSTRAINT "sales_return_order_id_sales_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_order"("id");--> statement-breakpoint
ALTER TABLE "sales_return" ADD CONSTRAINT "sales_return_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "shipment_event" ADD CONSTRAINT "shipment_event_order_id_sales_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_order"("id");--> statement-breakpoint
ALTER TABLE "shipment_event" ADD CONSTRAINT "shipment_event_shipment_id_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipment"("id");--> statement-breakpoint
ALTER TABLE "shipment_event" ADD CONSTRAINT "shipment_event_actor_id_user_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "shipment_event" ADD CONSTRAINT "shipment_event_command_id_fulfillment_command_id_fkey" FOREIGN KEY ("command_id") REFERENCES "fulfillment_command"("id");--> statement-breakpoint
-- Preserve historical stock: completed/returned orders were already issued by the old workflow.
-- updated_at is a historical fallback, explicitly labelled; inventory is NEVER modified here.
INSERT INTO order_fulfillment(order_id,stock_issued_at,delivered_at,provenance)
SELECT o.id, coalesce((SELECT min(m.created_at) FROM stock_movement m WHERE m.reference_type='order' AND m.reference_id=o.id AND m.type='issue'),o.updated_at),
coalesce((SELECT max(s.delivered_at) FROM shipment s WHERE s.order_id=o.id), (SELECT max(h.created_at) FROM order_status_history h WHERE h.order_id=o.id AND h.status='completed'),o.updated_at),'legacy_completed_fallback'
FROM sales_order o WHERE o.order_status IN ('completed','returned') ON CONFLICT DO NOTHING;
--> statement-breakpoint
-- Backfill only arithmetically consistent integer-VND documents. Audit reports the rest.
WITH totals AS (SELECT o.id, (o.grand_total-o.shipping_total)::bigint AS goods,sum(i.total) AS gross
FROM sales_order o JOIN sales_order_item i ON i.order_id=o.id
GROUP BY o.id HAVING sum(i.total)>0 AND o.grand_total>=o.shipping_total AND o.grand_total-o.shipping_total<=sum(i.total)
AND bool_and(i.total=trunc(i.total) AND i.quantity BETWEEN 1 AND 10000)
AND o.grand_total=trunc(o.grand_total) AND o.shipping_total=trunc(o.shipping_total)),
parts AS (SELECT i.*,t.goods,t.gross, floor(t.goods::numeric*i.total/t.gross)::bigint AS net,
mod(t.goods::numeric*i.total,t.gross) AS remainder FROM sales_order_item i JOIN totals t ON t.id=i.order_id),
ranked AS (SELECT *,row_number() over(partition by order_id order by remainder desc,id) AS rank,
goods-sum(net) over(partition by order_id) AS extra FROM parts)
INSERT INTO order_allocation(order_item_id,order_id,quantity,gross,discount,net)
SELECT id,order_id,quantity,total::bigint,total::bigint-net-(CASE WHEN rank<=extra THEN 1 ELSE 0 END),net+(CASE WHEN rank<=extra THEN 1 ELSE 0 END) FROM ranked;
--> statement-breakpoint
-- An existing issue ledger is authoritative even if a historical status is inconsistent.
INSERT INTO order_fulfillment(order_id,stock_issued_at,provenance)
SELECT o.id,min(m.created_at),'legacy_issue_ledger' FROM sales_order o
JOIN stock_movement m ON m.reference_type='order' AND m.reference_id=o.id AND m.type='issue'
GROUP BY o.id ON CONFLICT DO NOTHING;
