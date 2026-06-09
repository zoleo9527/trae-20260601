-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ponds" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "area" REAL NOT NULL,
    "species" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pondId" INTEGER NOT NULL,
    "inspectorId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dissolvedOxygen" REAL,
    "phValue" REAL,
    "ammoniaNitrogen" REAL,
    "waterTemp" REAL,
    "remarks" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "inspections_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "ponds" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "inspections_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "warnings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pondId" INTEGER NOT NULL,
    "inspectionId" INTEGER,
    "level" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metric" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "threshold" REAL NOT NULL,
    "remarks" TEXT NOT NULL DEFAULT '',
    "assignedTo" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "closedAt" DATETIME,
    CONSTRAINT "warnings_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "ponds" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "warnings_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "warnings_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "warning_remarks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "warningId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'manual',
    "sourceId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "warning_remarks_warningId_fkey" FOREIGN KEY ("warningId") REFERENCES "warnings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "warning_remarks_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "feedings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pondId" INTEGER NOT NULL,
    "feedType" TEXT NOT NULL,
    "plannedAmount" REAL NOT NULL,
    "actualAmount" REAL,
    "operatorId" INTEGER NOT NULL,
    "confirmedBy" INTEGER,
    "feedingDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feedings_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "ponds" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "feedings_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "feedings_confirmedBy_fkey" FOREIGN KEY ("confirmedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "medicines" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "specification" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "stock" REAL NOT NULL DEFAULT 0,
    "minStock" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "medicine_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "medicineId" INTEGER NOT NULL,
    "operationType" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "operatorId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "relatedPondId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "medicine_logs_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "medicines" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "medicine_logs_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "medicine_logs_relatedPondId_fkey" FOREIGN KEY ("relatedPondId") REFERENCES "ponds" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "status_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "operatorId" INTEGER NOT NULL,
    "remarks" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "status_logs_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "inspections_pondId_idx" ON "inspections"("pondId");

-- CreateIndex
CREATE INDEX "inspections_status_idx" ON "inspections"("status");

-- CreateIndex
CREATE INDEX "warnings_pondId_idx" ON "warnings"("pondId");

-- CreateIndex
CREATE INDEX "warnings_status_idx" ON "warnings"("status");

-- CreateIndex
CREATE INDEX "warnings_inspectionId_idx" ON "warnings"("inspectionId");

-- CreateIndex
CREATE INDEX "warning_remarks_warningId_idx" ON "warning_remarks"("warningId");

-- CreateIndex
CREATE INDEX "feedings_pondId_idx" ON "feedings"("pondId");

-- CreateIndex
CREATE INDEX "feedings_feedingDate_idx" ON "feedings"("feedingDate");

-- CreateIndex
CREATE INDEX "medicine_logs_medicineId_idx" ON "medicine_logs"("medicineId");

-- CreateIndex
CREATE INDEX "status_logs_entityType_entityId_idx" ON "status_logs"("entityType", "entityId");
