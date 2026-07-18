CREATE TABLE "leaves" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_public_id" uuid NOT NULL,
	"leave_date" date NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "bio_id" varchar(255);--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "company_id" varchar(255);--> statement-breakpoint
CREATE UNIQUE INDEX "bio_id_idx" ON "accounts" USING btree ("bio_id");