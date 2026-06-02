-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PackageItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "expectedProductId" TEXT,
    "quantity" INTEGER NOT NULL,
    "actualQuantity" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PackageItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PackageItem_expectedProductId_fkey" FOREIGN KEY ("expectedProductId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PackageItem" ("actualQuantity", "createdAt", "id", "packageId", "productId", "quantity", "updatedAt") SELECT "actualQuantity", "createdAt", "id", "packageId", "productId", "quantity", "updatedAt" FROM "PackageItem";
DROP TABLE "PackageItem";
ALTER TABLE "new_PackageItem" RENAME TO "PackageItem";
CREATE TABLE "new_ReviewItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewRecordId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "expectedProductId" TEXT,
    "expectedQty" INTEGER NOT NULL,
    "actualQty" INTEGER NOT NULL,
    "isMatch" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReviewItem_reviewRecordId_fkey" FOREIGN KEY ("reviewRecordId") REFERENCES "ReviewRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReviewItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReviewItem_expectedProductId_fkey" FOREIGN KEY ("expectedProductId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ReviewItem" ("actualQty", "createdAt", "expectedQty", "id", "isMatch", "productId", "reviewRecordId", "updatedAt") SELECT "actualQty", "createdAt", "expectedQty", "id", "isMatch", "productId", "reviewRecordId", "updatedAt" FROM "ReviewItem";
DROP TABLE "ReviewItem";
ALTER TABLE "new_ReviewItem" RENAME TO "ReviewItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
