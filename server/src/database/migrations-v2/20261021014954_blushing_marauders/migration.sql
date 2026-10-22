CREATE TABLE "upload_asset" (
	"key" text PRIMARY KEY,
	"url" text NOT NULL UNIQUE,
	"user_id" uuid NOT NULL,
	"state" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "checkout_session" ADD COLUMN "cart_snapshot" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "checkout_session" ADD COLUMN "cart_cleared_at" timestamp with time zone;--> statement-breakpoint
-- Preserve duplicate reviews before enforcing the legacy one-review-per-account rule.
CREATE TABLE IF NOT EXISTS "product_review_duplicates_backup" ("id" uuid PRIMARY KEY, "record" jsonb NOT NULL, "archived_at" timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
WITH ranked AS (SELECT id, row_number() OVER (PARTITION BY user_id, product_id ORDER BY (status = 'published') DESC, updated_at DESC, id) AS n FROM product_review WHERE user_id IS NOT NULL)
INSERT INTO product_review_duplicates_backup (id, record) SELECT r.id, to_jsonb(r) FROM product_review r JOIN ranked d ON d.id = r.id WHERE d.n > 1 ON CONFLICT DO NOTHING;
--> statement-breakpoint
DELETE FROM product_review WHERE id IN (SELECT id FROM product_review_duplicates_backup);
--> statement-breakpoint
CREATE UNIQUE INDEX "product_review_user_product_unique" ON "product_review" ("user_id","product_id");--> statement-breakpoint
-- Upload ownership is retained after account deletion so orphan cleanup can still remove bucket objects.
--> statement-breakpoint
-- Capture original cart rows for online orders still awaiting payment; never re-clear already-paid historical orders.
UPDATE checkout_session cs SET cart_snapshot = COALESCE((
  SELECT jsonb_agg(jsonb_build_object('id', ci.id, 'quantity', least(oi.quantity, ci.quantity)))
  FROM sales_order_item oi JOIN cart c ON c.user_id = cs.user_id AND c.status = 'active'
  JOIN cart_item ci ON ci.cart_id = c.id AND ci.variant_id = oi.variant_id AND ci.created_at <= cs.created_at
  WHERE oi.order_id = cs.order_id
), '[]'::jsonb)
WHERE cs.provider <> 'cod' AND cs.state IN ('created', 'creating', 'ready');
