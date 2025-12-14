-- Add data column to Visit for activity-specific payloads
ALTER TABLE "Visit" ADD COLUMN "data" JSONB;
