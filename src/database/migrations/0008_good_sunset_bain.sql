ALTER TABLE "faces" ADD COLUMN "company_id" varchar(255);--> statement-breakpoint
CREATE INDEX "company_id_idx" ON "faces" USING btree ("company_id");