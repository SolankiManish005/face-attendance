ALTER TABLE "faces" ADD COLUMN "company_id" varchar(255);
CREATE INDEX IF NOT EXISTS "company_id_idx" ON "faces" ("company_id");