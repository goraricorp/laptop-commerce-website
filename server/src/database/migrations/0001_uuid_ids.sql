ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_user_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "address" DROP CONSTRAINT IF EXISTS "address_account_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "cart" DROP CONSTRAINT IF EXISTS "cart_account_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "conversation" DROP CONSTRAINT IF EXISTS "conversation_account_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "bill" DROP CONSTRAINT IF EXISTS "bill_account_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "rating" DROP CONSTRAINT IF EXISTS "rating_account_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_user_id_user_id_fk";--> statement-breakpoint

CREATE TEMPORARY TABLE "user_uuid_map" (
	"old_id" text PRIMARY KEY,
	"new_id" uuid NOT NULL
) ON COMMIT DROP;--> statement-breakpoint

INSERT INTO "user_uuid_map" ("old_id", "new_id")
SELECT
	"id",
	CASE
		WHEN "id" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN "id"::uuid
		ELSE gen_random_uuid()
	END
FROM "user";--> statement-breakpoint

UPDATE "account" AS child SET "user_id" = map."new_id"::text FROM "user_uuid_map" AS map WHERE child."user_id" = map."old_id";--> statement-breakpoint
UPDATE "address" AS child SET "account_id" = map."new_id"::text FROM "user_uuid_map" AS map WHERE child."account_id" = map."old_id";--> statement-breakpoint
UPDATE "cart" AS child SET "account_id" = map."new_id"::text FROM "user_uuid_map" AS map WHERE child."account_id" = map."old_id";--> statement-breakpoint
UPDATE "conversation" AS child SET "account_id" = map."new_id"::text FROM "user_uuid_map" AS map WHERE child."account_id" = map."old_id";--> statement-breakpoint
UPDATE "bill" AS child SET "account_id" = map."new_id"::text FROM "user_uuid_map" AS map WHERE child."account_id" = map."old_id";--> statement-breakpoint
UPDATE "rating" AS child SET "account_id" = map."new_id"::text FROM "user_uuid_map" AS map WHERE child."account_id" = map."old_id";--> statement-breakpoint
UPDATE "session" AS child SET "user_id" = map."new_id"::text FROM "user_uuid_map" AS map WHERE child."user_id" = map."old_id";--> statement-breakpoint
UPDATE "user" AS parent SET "id" = map."new_id"::text FROM "user_uuid_map" AS map WHERE parent."id" = map."old_id";--> statement-breakpoint

UPDATE "account" SET "id" = gen_random_uuid()::text
WHERE "id" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';--> statement-breakpoint
UPDATE "session" SET "id" = gen_random_uuid()::text
WHERE "id" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';--> statement-breakpoint
UPDATE "verification" SET "id" = gen_random_uuid()::text
WHERE "id" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';--> statement-breakpoint

ALTER TABLE "user" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "user_id" SET DATA TYPE uuid USING "user_id"::uuid;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "user_id" SET DATA TYPE uuid USING "user_id"::uuid;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "address" ALTER COLUMN "account_id" SET DATA TYPE uuid USING "account_id"::uuid;--> statement-breakpoint
ALTER TABLE "cart" ALTER COLUMN "account_id" SET DATA TYPE uuid USING "account_id"::uuid;--> statement-breakpoint
ALTER TABLE "conversation" ALTER COLUMN "account_id" SET DATA TYPE uuid USING "account_id"::uuid;--> statement-breakpoint
ALTER TABLE "bill" ALTER COLUMN "account_id" SET DATA TYPE uuid USING "account_id"::uuid;--> statement-breakpoint
ALTER TABLE "rating" ALTER COLUMN "account_id" SET DATA TYPE uuid USING "account_id"::uuid;--> statement-breakpoint

ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_account_id_user_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_account_id_user_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_account_id_user_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill" ADD CONSTRAINT "bill_account_id_user_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating" ADD CONSTRAINT "rating_account_id_user_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
