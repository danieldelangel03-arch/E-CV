CREATE TYPE "public"."profile_version_kind" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'student');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" varchar(100) NOT NULL,
	"subject_email" varchar(320),
	"subject_slug" varchar(80),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"byte_size" integer NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"bytes" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_current" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"draft_version_id" uuid,
	"published_version_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"kind" "profile_version_kind" NOT NULL,
	"content" jsonb NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"source_version_id" uuid,
	"created_by" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slug" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "profiles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_assets" ADD CONSTRAINT "profile_assets_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_current" ADD CONSTRAINT "profile_current_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_versions" ADD CONSTRAINT "profile_versions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_versions" ADD CONSTRAINT "profile_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "profile_assets_profile_id_idx" ON "profile_assets" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_versions_profile_sequence_unique" ON "profile_versions" USING btree ("profile_id","sequence");--> statement-breakpoint
CREATE INDEX "profile_versions_profile_id_idx" ON "profile_versions" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_slug_format_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND "slug" <> 'admin');
--> statement-breakpoint
ALTER TABLE "profile_assets" ADD CONSTRAINT "profile_assets_size_check" CHECK ("byte_size" > 0 AND "byte_size" <= 2097152);
--> statement-breakpoint
ALTER TABLE "profile_assets" ADD CONSTRAINT "profile_assets_content_type_check" CHECK ("content_type" IN ('image/jpeg', 'image/png', 'image/webp'));
--> statement-breakpoint
CREATE OR REPLACE FUNCTION eprofile_prevent_slug_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS DISTINCT FROM OLD.slug THEN
    RAISE EXCEPTION 'EProfile slugs are permanent';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER profiles_slug_is_immutable
BEFORE UPDATE ON "profiles"
FOR EACH ROW EXECUTE FUNCTION eprofile_prevent_slug_change();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION eprofile_prevent_version_update()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Profile versions are immutable snapshots';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER profile_versions_are_immutable
BEFORE UPDATE ON "profile_versions"
FOR EACH ROW EXECUTE FUNCTION eprofile_prevent_version_update();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION eprofile_validate_current_versions()
RETURNS trigger AS $$
DECLARE
  draft_record record;
  published_record record;
BEGIN
  IF NEW.draft_version_id IS NOT NULL THEN
    SELECT profile_id, kind INTO draft_record FROM profile_versions WHERE id = NEW.draft_version_id;
    IF NOT FOUND OR draft_record.profile_id <> NEW.profile_id OR draft_record.kind <> 'draft' THEN
      RAISE EXCEPTION 'draft_version_id must reference this profile''s draft snapshot';
    END IF;
  END IF;

  IF NEW.published_version_id IS NOT NULL THEN
    SELECT profile_id, kind INTO published_record FROM profile_versions WHERE id = NEW.published_version_id;
    IF NOT FOUND OR published_record.profile_id <> NEW.profile_id OR published_record.kind <> 'published' THEN
      RAISE EXCEPTION 'published_version_id must reference this profile''s published snapshot';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER profile_current_versions_match_profile
BEFORE INSERT OR UPDATE ON "profile_current"
FOR EACH ROW EXECUTE FUNCTION eprofile_validate_current_versions();
