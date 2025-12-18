-- Add price to products (idempotent)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "price" INTEGER;
ALTER TABLE "Product" ALTER COLUMN "price" SET DEFAULT 0;
ALTER TABLE "Product" ALTER COLUMN "price" SET NOT NULL;
