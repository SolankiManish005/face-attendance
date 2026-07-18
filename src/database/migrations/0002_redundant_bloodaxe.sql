CREATE TABLE IF NOT EXISTS "faces" (
	"created_at" bigint NOT NULL,
	"updated_at" bigint,
	"id" serial PRIMARY KEY NOT NULL,
	"account_public_id" uuid NOT NULL,
	"face_image" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_public_id_idx" ON "faces" USING btree ("account_public_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "face_image_idx" ON "faces" USING btree ("face_image");