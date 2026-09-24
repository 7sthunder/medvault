CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"scope" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"password_hash" text
);
--> statement-breakpoint
CREATE TABLE "adherence_daily" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"medication_id" text,
	"scheduled" integer DEFAULT 0 NOT NULL,
	"taken" integer DEFAULT 0 NOT NULL,
	"missed" integer DEFAULT 0 NOT NULL,
	"skipped" integer DEFAULT 0 NOT NULL,
	"snoozed" integer DEFAULT 0 NOT NULL,
	"adherence_percent" numeric(5, 2),
	"streak_day" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "adherence_daily_user_date_med_uq" UNIQUE NULLS NOT DISTINCT("user_id","date","medication_id")
);
--> statement-breakpoint
CREATE TABLE "ai_insights" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"category" text NOT NULL,
	"summary" text NOT NULL,
	"detail" text,
	"suggested_action_type" text,
	"data_snapshot" jsonb NOT NULL,
	"source" text NOT NULL,
	"confidence" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "caregiver_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_user_id" text NOT NULL,
	"caregiver_user_id" text NOT NULL,
	"relationship_id" text,
	"dose_event_id" text,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "caregiver_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_user_id" text NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"message" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone DEFAULT now() + interval '7 days' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "caregiver_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "caregiver_relationships" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_user_id" text NOT NULL,
	"caregiver_user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"relation_type" text DEFAULT 'family' NOT NULL,
	"permissions" jsonb,
	"invited_by_user_id" text,
	"revoked_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demo_state" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"simulation_now" timestamp with time zone,
	"time_multiplier" integer DEFAULT 1 NOT NULL,
	"scenario" text DEFAULT 'baseline' NOT NULL,
	"has_caregiver_demo_data" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dose_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"dose_event_id" text NOT NULL,
	"action" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "dose_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"medication_id" text NOT NULL,
	"schedule_id" text,
	"scheduled_for" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"missed_deadline" timestamp with time zone,
	"taken_at" timestamp with time zone,
	"skipped_at" timestamp with time zone,
	"skipped_reason" text,
	"snooze_count" integer DEFAULT 0 NOT NULL,
	"snooze_until" timestamp with time zone,
	"status_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"source" text DEFAULT 'generated' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medication_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"medication_id" text NOT NULL,
	"time_of_day" text NOT NULL,
	"days_of_week" smallint[] DEFAULT ARRAY[0,1,2,3,4,5,6] NOT NULL,
	"dosage_amount" numeric(10, 2),
	"instruction_override" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"dosage_amount" numeric(10, 2) NOT NULL,
	"dosage_unit" text NOT NULL,
	"instructions" text,
	"notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"color" text DEFAULT '#10b981' NOT NULL,
	"reminders_enabled" boolean DEFAULT true NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"theme" text DEFAULT 'light' NOT NULL,
	"missed_after_minutes" integer DEFAULT 30 NOT NULL,
	"snooze_minutes" integer DEFAULT 10 NOT NULL,
	"max_snoozes" integer DEFAULT 3 NOT NULL,
	"reminder_before_minutes" integer DEFAULT 5 NOT NULL,
	"notification_prefs" jsonb DEFAULT '{"doseReminders":true,"caregiverMissedAlerts":true,"insights":true,"sounds":true}'::jsonb NOT NULL,
	"caregiver_alert_prefs" jsonb DEFAULT '{"missedDoseOn":true,"adherenceDropThreshold":null,"dailyDigest":false}'::jsonb NOT NULL,
	"reduce_motion" boolean DEFAULT false NOT NULL,
	"ui_density" text DEFAULT 'comfortable' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adherence_daily" ADD CONSTRAINT "adherence_daily_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adherence_daily" ADD CONSTRAINT "adherence_daily_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caregiver_alerts" ADD CONSTRAINT "caregiver_alerts_patient_user_id_users_id_fk" FOREIGN KEY ("patient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caregiver_alerts" ADD CONSTRAINT "caregiver_alerts_caregiver_user_id_users_id_fk" FOREIGN KEY ("caregiver_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caregiver_alerts" ADD CONSTRAINT "caregiver_alerts_relationship_id_caregiver_relationships_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "public"."caregiver_relationships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caregiver_alerts" ADD CONSTRAINT "caregiver_alerts_dose_event_id_dose_events_id_fk" FOREIGN KEY ("dose_event_id") REFERENCES "public"."dose_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caregiver_invitations" ADD CONSTRAINT "caregiver_invitations_patient_user_id_users_id_fk" FOREIGN KEY ("patient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caregiver_relationships" ADD CONSTRAINT "caregiver_relationships_patient_user_id_users_id_fk" FOREIGN KEY ("patient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caregiver_relationships" ADD CONSTRAINT "caregiver_relationships_caregiver_user_id_users_id_fk" FOREIGN KEY ("caregiver_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caregiver_relationships" ADD CONSTRAINT "caregiver_relationships_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demo_state" ADD CONSTRAINT "demo_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dose_actions" ADD CONSTRAINT "dose_actions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dose_actions" ADD CONSTRAINT "dose_actions_dose_event_id_dose_events_id_fk" FOREIGN KEY ("dose_event_id") REFERENCES "public"."dose_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dose_events" ADD CONSTRAINT "dose_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dose_events" ADD CONSTRAINT "dose_events_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dose_events" ADD CONSTRAINT "dose_events_schedule_id_medication_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."medication_schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_schedules" ADD CONSTRAINT "medication_schedules_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_insights_user_created_idx" ON "ai_insights" USING btree ("user_id","created_at" desc);--> statement-breakpoint
CREATE INDEX "caregiver_alerts_caregiver_status_idx" ON "caregiver_alerts" USING btree ("caregiver_user_id","status");--> statement-breakpoint
CREATE INDEX "caregiver_alerts_patient_idx" ON "caregiver_alerts" USING btree ("patient_user_id");--> statement-breakpoint
CREATE INDEX "caregiver_relationships_patient_idx" ON "caregiver_relationships" USING btree ("patient_user_id");--> statement-breakpoint
CREATE INDEX "caregiver_relationships_caregiver_idx" ON "caregiver_relationships" USING btree ("caregiver_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "caregiver_relationships_pair_uq" ON "caregiver_relationships" USING btree ("patient_user_id","caregiver_user_id");--> statement-breakpoint
CREATE INDEX "dose_actions_user_occurred_idx" ON "dose_actions" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "dose_actions_dose_event_idx" ON "dose_actions" USING btree ("dose_event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dose_events_med_scheduled_uq" ON "dose_events" USING btree ("medication_id","scheduled_for");--> statement-breakpoint
CREATE INDEX "dose_events_user_scheduled_idx" ON "dose_events" USING btree ("user_id","scheduled_for");--> statement-breakpoint
CREATE INDEX "dose_events_user_status_idx" ON "dose_events" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "dose_events_user_scheduled_status_idx" ON "dose_events" USING btree ("user_id","scheduled_for","status");--> statement-breakpoint
CREATE INDEX "dose_events_is_demo_idx" ON "dose_events" USING btree ("is_demo");--> statement-breakpoint
CREATE INDEX "medication_schedules_med_id_idx" ON "medication_schedules" USING btree ("medication_id");--> statement-breakpoint
CREATE UNIQUE INDEX "medication_schedules_med_time_uq" ON "medication_schedules" USING btree ("medication_id","time_of_day");--> statement-breakpoint
CREATE INDEX "medications_user_archived_idx" ON "medications" USING btree ("user_id","archived_at");--> statement-breakpoint
CREATE INDEX "medications_user_status_idx" ON "medications" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "medications_user_name_active_uq" ON "medications" USING btree ("user_id","name") WHERE archived_at is null;--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at" desc);