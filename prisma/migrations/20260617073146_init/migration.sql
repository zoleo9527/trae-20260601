-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TeamBuilding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "participantCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'NONE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PrivateRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "bookedAt" DATETIME NOT NULL,
    "teamBuildingId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrivateRoom_teamBuildingId_fkey" FOREIGN KEY ("teamBuildingId") REFERENCES "TeamBuilding" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Accommodation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomNumber" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "checkInDate" DATETIME NOT NULL,
    "checkOutDate" DATETIME NOT NULL,
    "depositAmount" DECIMAL,
    "depositPaid" BOOLEAN NOT NULL DEFAULT false,
    "teamBuildingId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Accommodation_teamBuildingId_fkey" FOREIGN KEY ("teamBuildingId") REFERENCES "TeamBuilding" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "teamBuildingId" TEXT NOT NULL,
    "stockStatus" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ingredient_teamBuildingId_fkey" FOREIGN KEY ("teamBuildingId") REFERENCES "TeamBuilding" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpenseSettlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamBuildingId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "depositAmount" DECIMAL NOT NULL,
    "paidAmount" DECIMAL NOT NULL,
    "outstandingAmount" DECIMAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT NOT NULL,
    CONSTRAINT "ExpenseSettlement_teamBuildingId_fkey" FOREIGN KEY ("teamBuildingId") REFERENCES "TeamBuilding" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TeamBuilding_status_idx" ON "TeamBuilding"("status");

-- CreateIndex
CREATE INDEX "TeamBuilding_date_idx" ON "TeamBuilding"("date");

-- CreateIndex
CREATE INDEX "TeamBuilding_riskLevel_idx" ON "TeamBuilding"("riskLevel");

-- CreateIndex
CREATE INDEX "ExpenseSettlement_status_idx" ON "ExpenseSettlement"("status");
