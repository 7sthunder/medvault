CREATE TABLE "appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_user_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"doctor_name" text NOT NULL,
	"specialty" text,
	"clinic_name" text,
	"appointment_date" timestamp with time zone NOT NULL,
	"notes" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"reminder_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'patient' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "access_code" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_user_id_users_id_fk" FOREIGN KEY ("patient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_patient_date_idx" ON "appointments" USING btree ("patient_user_id","appointment_date" desc);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_access_code_unique" UNIQUE("access_code");