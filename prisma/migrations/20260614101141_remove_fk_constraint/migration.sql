-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OperationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "operatorId" TEXT,
    "operatorName" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_OperationLog" ("action", "businessId", "businessType", "createdAt", "details", "fromStatus", "id", "operatorId", "operatorName", "toStatus") SELECT "action", "businessId", "businessType", "createdAt", "details", "fromStatus", "id", "operatorId", "operatorName", "toStatus" FROM "OperationLog";
DROP TABLE "OperationLog";
ALTER TABLE "new_OperationLog" RENAME TO "OperationLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
