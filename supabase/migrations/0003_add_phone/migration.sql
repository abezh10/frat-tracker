-- Add phone column to User table
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

-- Backfill existing rows with empty string so NOT NULL can be applied
UPDATE "User" SET "phone" = '' WHERE "phone" IS NULL;

-- Make phone required for new rows
ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;
