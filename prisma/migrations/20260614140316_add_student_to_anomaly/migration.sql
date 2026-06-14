-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Anomaly" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "arrangementId" TEXT NOT NULL,
    "studentId" TEXT,
    "reportedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "processedBy" TEXT,
    "processedAt" DATETIME,
    "solution" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Anomaly_arrangementId_fkey" FOREIGN KEY ("arrangementId") REFERENCES "Arrangement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Anomaly_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Anomaly_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Anomaly_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Anomaly" ("arrangementId", "createdAt", "description", "id", "processedAt", "processedBy", "reportedBy", "solution", "status", "type", "updatedAt") SELECT "arrangementId", "createdAt", "description", "id", "processedAt", "processedBy", "reportedBy", "solution", "status", "type", "updatedAt" FROM "Anomaly";
DROP TABLE "Anomaly";
ALTER TABLE "new_Anomaly" RENAME TO "Anomaly";
CREATE INDEX "Anomaly_arrangementId_idx" ON "Anomaly"("arrangementId");
CREATE INDEX "Anomaly_studentId_idx" ON "Anomaly"("studentId");
CREATE INDEX "Anomaly_status_idx" ON "Anomaly"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
