ALTER TYPE "public"."payment_status" ADD VALUE 'pending' BEFORE 'paid';--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "provider_ref" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_provider_providerRef_unique" UNIQUE("provider","provider_ref");--> statement-breakpoint
UPDATE "payments" SET "paid_at" = "created_at" WHERE "status" = 'paid';