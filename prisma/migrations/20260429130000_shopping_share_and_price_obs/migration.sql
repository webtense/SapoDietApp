-- Idempotente: estas tablas ya las creó 20260419195000_shopping_share_and_prices_v33
ALTER TABLE "ShoppingItem" ADD COLUMN IF NOT EXISTS "actualPrice" DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS "ShoppingShare" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shoppingListId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "sharePhone" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShoppingShare_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ShoppingPriceObservation" (
    "id" TEXT NOT NULL,
    "shoppingItemId" TEXT,
    "userId" TEXT,
    "supermarket" TEXT NOT NULL,
    "postalCode" TEXT,
    "regionKey" TEXT,
    "itemName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "observedPrice" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShoppingPriceObservation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ShoppingShare_tokenHash_key" ON "ShoppingShare"("tokenHash");
CREATE INDEX IF NOT EXISTS "ShoppingShare_userId_idx" ON "ShoppingShare"("userId");
CREATE INDEX IF NOT EXISTS "ShoppingShare_expiresAt_idx" ON "ShoppingShare"("expiresAt");
CREATE INDEX IF NOT EXISTS "ShoppingPriceObservation_itemName_supermarket_idx" ON "ShoppingPriceObservation"("itemName", "supermarket");
CREATE INDEX IF NOT EXISTS "ShoppingPriceObservation_regionKey_itemName_idx" ON "ShoppingPriceObservation"("regionKey", "itemName");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ShoppingShare_shoppingListId_fkey') THEN
    ALTER TABLE "ShoppingShare" ADD CONSTRAINT "ShoppingShare_shoppingListId_fkey" FOREIGN KEY ("shoppingListId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ShoppingPriceObservation_shoppingItemId_fkey') THEN
    ALTER TABLE "ShoppingPriceObservation" ADD CONSTRAINT "ShoppingPriceObservation_shoppingItemId_fkey" FOREIGN KEY ("shoppingItemId") REFERENCES "ShoppingItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
