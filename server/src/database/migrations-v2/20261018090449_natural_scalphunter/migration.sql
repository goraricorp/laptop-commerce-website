ALTER TABLE "product" DROP COLUMN "product_type";--> statement-breakpoint
DROP TYPE "product_type";--> statement-breakpoint
CREATE TYPE "product_type" AS ENUM('laptop', 'monitor', 'component', 'accessory', 'furniture', 'gaming', 'other');
