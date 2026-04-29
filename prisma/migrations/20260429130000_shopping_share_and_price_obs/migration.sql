-- AlterTable: add actualPrice to ShoppingItem
ALTER TABLE "ShoppingItem" ADD COLUMN "actualPrice" DOUBLE PRECISION;

-- CreateTable: ShoppingShare
CREATE TABLE "ShoppingShare" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shoppingListId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "sharePhone" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShoppingShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ShoppingPriceObservation
CREATE TABLE "ShoppingPriceObservation" (
    "id" TEXT NOT NULL,
    "shoppingItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingShare_tokenHash_key" ON "ShoppingShare"("tokenHash");
CREATE INDEX "ShoppingShare_userId_idx" ON "ShoppingShare"("userId");
CREATE INDEX "ShoppingShare_expiresAt_idx" ON "ShoppingShare"("expiresAt");
CREATE INDEX "ShoppingPriceObservation_itemName_supermarket_idx" ON "ShoppingPriceObservation"("itemName", "supermarket");
CREATE INDEX "ShoppingPriceObservation_regionKey_itemName_idx" ON "ShoppingPriceObservation"("regionKey", "itemName");

-- AddForeignKey
ALTER TABLE "ShoppingShare" ADD CONSTRAINT "ShoppingShare_shoppingListId_fkey" FOREIGN KEY ("shoppingListId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShoppingPriceObservation" ADD CONSTRAINT "ShoppingPriceObservation_shoppingItemId_fkey" FOREIGN KEY ("shoppingItemId") REFERENCES "ShoppingItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
