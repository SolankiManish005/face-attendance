CREATE TABLE IF NOT EXISTS "attendance" (
	"created_at" bigint NOT NULL,
	"updated_at" bigint,
	"id" serial PRIMARY KEY NOT NULL,
	"account_public_id" uuid NOT NULL,
	"check_in" timestamp NOT NULL,
	"check_out" timestamp
);
