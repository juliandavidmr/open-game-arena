CREATE TYPE "public"."player_color" AS ENUM('white', 'black');--> statement-breakpoint
CREATE TYPE "public"."ending_cause" AS ENUM('checkmate', 'stalemate', 'insufficient_material', 'resignation', 'forfeit', 'move_limit');--> statement-breakpoint
CREATE TYPE "public"."match_lifecycle" AS ENUM('waiting', 'active', 'completed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."match_result" AS ENUM('white', 'black', 'draw');--> statement-breakpoint
CREATE TABLE "agent_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seat_id" uuid NOT NULL,
	"fingerprint" text NOT NULL,
	"client_name" text NOT NULL,
	"client_version" text NOT NULL,
	"model" text,
	"user_agent" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"revision" bigint NOT NULL,
	"kind" text NOT NULL,
	"fingerprint" text NOT NULL,
	"response" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"revision" bigint NOT NULL,
	"type" text NOT NULL,
	"color" "player_color",
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lifecycle" "match_lifecycle" DEFAULT 'waiting' NOT NULL,
	"fen" text NOT NULL,
	"revision" bigint DEFAULT 0 NOT NULL,
	"turn" "player_color" DEFAULT 'white' NOT NULL,
	"turn_deadline" timestamp with time zone,
	"waiting_expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"activated_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"result" "match_result",
	"ending_cause" "ending_cause",
	"move_count" integer DEFAULT 0 NOT NULL,
	"match_hash" text NOT NULL,
	"match_ciphertext" text,
	"public_slug" text
);
--> statement-breakpoint
CREATE TABLE "moves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"ply" integer NOT NULL,
	"before_revision" bigint NOT NULL,
	"after_revision" bigint NOT NULL,
	"from" text NOT NULL,
	"to" text NOT NULL,
	"promotion" text,
	"san" text NOT NULL,
	"fen" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"response" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_seats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"color" "player_color" NOT NULL,
	"ready" boolean DEFAULT false NOT NULL,
	"token_hash" text NOT NULL,
	"token_ciphertext" text
);
--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_seat_id_player_seats_id_fk" FOREIGN KEY ("seat_id") REFERENCES "public"."player_seats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency" ADD CONSTRAINT "idempotency_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moves" ADD CONSTRAINT "moves_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moves" ADD CONSTRAINT "moves_profile_id_agent_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."agent_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_seats" ADD CONSTRAINT "player_seats_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "profile_descriptor_idx" ON "agent_profiles" USING btree ("seat_id","fingerprint");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_idx" ON "idempotency" USING btree ("match_id","profile_id","revision","kind","fingerprint");--> statement-breakpoint
CREATE UNIQUE INDEX "matches_hash_idx" ON "matches" USING btree ("match_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "matches_public_slug_idx" ON "matches" USING btree ("public_slug");--> statement-breakpoint
CREATE INDEX "matches_completed_idx" ON "matches" USING btree ("completed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "move_ply_idx" ON "moves" USING btree ("match_id","ply");--> statement-breakpoint
CREATE UNIQUE INDEX "move_retry_idx" ON "moves" USING btree ("match_id","profile_id","before_revision","from","to","promotion");--> statement-breakpoint
CREATE UNIQUE INDEX "seat_match_color_idx" ON "player_seats" USING btree ("match_id","color");--> statement-breakpoint
CREATE UNIQUE INDEX "seat_token_idx" ON "player_seats" USING btree ("token_hash");