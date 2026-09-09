CREATE TYPE "public"."profile_origin" AS ENUM('auto', 'manual');--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "origin" "profile_origin" DEFAULT 'manual' NOT NULL;