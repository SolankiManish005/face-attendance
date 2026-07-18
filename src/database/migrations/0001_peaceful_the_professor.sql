ALTER TABLE "accounts" ADD COLUMN "dob" date NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "blood_group" varchar(5) NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "designation" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "department" varchar(255) NOT NULL;