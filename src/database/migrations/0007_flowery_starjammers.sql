ALTER TABLE "accounts" ALTER COLUMN "bio_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "company_id" varchar(255);