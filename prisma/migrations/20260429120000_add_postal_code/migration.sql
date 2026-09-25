-- Idempotente: la columna ya la creó 20260419195000_shopping_share_and_prices_v33
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
