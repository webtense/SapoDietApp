BEGIN;

ALTER TABLE "ShoppingItem"
ADD COLUMN "actualPrice" DOUBLE PRECISION;

ALTER TABLE "Profile"
ADD COLUMN "postalCode" TEXT;

CREATE TABLE "ShoppingShare" (
  "id" TEXT NOT NULL,
  "shoppingListId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "sharePhone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ShoppingShare_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShoppingPriceObservation" (
  "id" TEXT NOT NULL,
  "shoppingItemId" TEXT,
  "userId" TEXT,
  "supermarket" TEXT NOT NULL,
  "postalCode" TEXT,
  "regionKey" TEXT,
  "itemName" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "observedPrice" DOUBLE PRECISION NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'shared-link',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ShoppingPriceObservation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShoppingShare_tokenHash_key" ON "ShoppingShare"("tokenHash");
CREATE INDEX "ShoppingShare_shoppingListId_createdAt_idx" ON "ShoppingShare"("shoppingListId", "createdAt");
CREATE INDEX "ShoppingShare_userId_createdAt_idx" ON "ShoppingShare"("userId", "createdAt");
CREATE INDEX "ShoppingShare_expiresAt_idx" ON "ShoppingShare"("expiresAt");

CREATE INDEX "ShoppingPriceObservation_shoppingItemId_idx" ON "ShoppingPriceObservation"("shoppingItemId");
CREATE INDEX "ShoppingPriceObservation_userId_createdAt_idx" ON "ShoppingPriceObservation"("userId", "createdAt");
CREATE INDEX "ShoppingPriceObservation_supermarket_regionKey_itemName_createdAt_idx" ON "ShoppingPriceObservation"("supermarket", "regionKey", "itemName", "createdAt");

ALTER TABLE "ShoppingShare"
ADD CONSTRAINT "ShoppingShare_shoppingListId_fkey"
FOREIGN KEY ("shoppingListId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ShoppingShare"
ADD CONSTRAINT "ShoppingShare_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ShoppingPriceObservation"
ADD CONSTRAINT "ShoppingPriceObservation_shoppingItemId_fkey"
FOREIGN KEY ("shoppingItemId") REFERENCES "ShoppingItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ShoppingPriceObservation"
ADD CONSTRAINT "ShoppingPriceObservation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
