-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PackagingRequisitionHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requisitionId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "remark" TEXT NOT NULL,
    "changes" TEXT,
    "scheduleChangeNotified" BOOLEAN NOT NULL DEFAULT false,
    "changeHandled" BOOLEAN NOT NULL DEFAULT false,
    "changeAffected" BOOLEAN,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PackagingRequisitionHistory_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "PackagingRequisition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PackagingRequisitionHistory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PackagingRequisitionHistory" ("action", "changes", "createdAt", "createdById", "id", "newStatus", "oldStatus", "remark", "requisitionId", "scheduleChangeNotified") SELECT "action", "changes", "createdAt", "createdById", "id", "newStatus", "oldStatus", "remark", "requisitionId", "scheduleChangeNotified" FROM "PackagingRequisitionHistory";
DROP TABLE "PackagingRequisitionHistory";
ALTER TABLE "new_PackagingRequisitionHistory" RENAME TO "PackagingRequisitionHistory";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
