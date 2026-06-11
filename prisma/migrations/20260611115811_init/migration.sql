-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "brandId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SalesReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reportNo" TEXT NOT NULL,
    "brandId" INTEGER NOT NULL,
    "reportMonth" TEXT NOT NULL,
    "salesAmount" REAL NOT NULL,
    "rentDeduction" REAL NOT NULL DEFAULT 0,
    "netSettlement" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "remark" TEXT,
    "submitterId" INTEGER,
    "submittedAt" DATETIME,
    "materialsCheckerId" INTEGER,
    "materialsCheckedAt" DATETIME,
    "reviewerId" INTEGER,
    "reviewedAt" DATETIME,
    "settlerId" INTEGER,
    "settledAt" DATETIME,
    "settlementAmount" REAL,
    "settlementDate" DATETIME,
    "paymentMethod" TEXT,
    "rejectReason" TEXT,
    "missingMaterials" TEXT,
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "deadline" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalesReport_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesReport_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SalesReport_materialsCheckerId_fkey" FOREIGN KEY ("materialsCheckerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SalesReport_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SalesReport_settlerId_fkey" FOREIGN KEY ("settlerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Material" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "salesReportId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "received" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" DATETIME,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Material_salesReportId_fkey" FOREIGN KEY ("salesReportId") REFERENCES "SalesReport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "salesReportId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "operatorId" INTEGER,
    "operatorName" TEXT NOT NULL,
    "remark" TEXT,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_salesReportId_fkey" FOREIGN KEY ("salesReportId") REFERENCES "SalesReport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_code_key" ON "Brand"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SalesReport_reportNo_key" ON "SalesReport"("reportNo");

-- CreateIndex
CREATE INDEX "SalesReport_status_idx" ON "SalesReport"("status");

-- CreateIndex
CREATE INDEX "SalesReport_brandId_idx" ON "SalesReport"("brandId");

-- CreateIndex
CREATE INDEX "SalesReport_reportMonth_idx" ON "SalesReport"("reportMonth");

-- CreateIndex
CREATE INDEX "ActivityLog_salesReportId_idx" ON "ActivityLog"("salesReportId");
