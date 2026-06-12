-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BidRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "announcementId" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "bidAmount" DECIMAL NOT NULL,
    "registrationTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" DATETIME,
    "confirmedBy" TEXT,
    "rejectedAt" DATETIME,
    "rejectedBy" TEXT,
    "rejectionReason" TEXT,
    "withdrawnAt" DATETIME,
    CONSTRAINT "BidRegistration_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BidRegistration_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BidRegistration_confirmedBy_fkey" FOREIGN KEY ("confirmedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BidRegistration_rejectedBy_fkey" FOREIGN KEY ("rejectedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BidRegistration" ("announcementId", "bidAmount", "bidderId", "confirmedAt", "id", "registrationTime", "rejectedAt", "rejectionReason", "status") SELECT "announcementId", "bidAmount", "bidderId", "confirmedAt", "id", "registrationTime", "rejectedAt", "rejectionReason", "status" FROM "BidRegistration";
DROP TABLE "BidRegistration";
ALTER TABLE "new_BidRegistration" RENAME TO "BidRegistration";
CREATE TABLE "new_DepositRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registrationId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "paymentTime" DATETIME,
    "paidBy" TEXT,
    "refundTime" DATETIME,
    "refundedBy" TEXT,
    "refundReason" TEXT,
    "paymentMethod" TEXT,
    "transactionNumber" TEXT,
    "payerId" TEXT,
    CONSTRAINT "DepositRecord_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "BidRegistration" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DepositRecord_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DepositRecord_paidBy_fkey" FOREIGN KEY ("paidBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DepositRecord_refundedBy_fkey" FOREIGN KEY ("refundedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DepositRecord" ("amount", "id", "payerId", "paymentMethod", "paymentTime", "refundTime", "registrationId", "status", "transactionNumber") SELECT "amount", "id", "payerId", "paymentMethod", "paymentTime", "refundTime", "registrationId", "status", "transactionNumber" FROM "DepositRecord";
DROP TABLE "DepositRecord";
ALTER TABLE "new_DepositRecord" RENAME TO "DepositRecord";
CREATE UNIQUE INDEX "DepositRecord_registrationId_key" ON "DepositRecord"("registrationId");
CREATE TABLE "new_TransactionConfirmation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registrationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "finalPrice" DECIMAL NOT NULL,
    "confirmedAt" DATETIME,
    "confirmedBy" TEXT,
    "cancelledAt" DATETIME,
    "cancelledBy" TEXT,
    "cancelReason" TEXT,
    "contractNumber" TEXT,
    CONSTRAINT "TransactionConfirmation_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "BidRegistration" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TransactionConfirmation_confirmedBy_fkey" FOREIGN KEY ("confirmedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TransactionConfirmation_cancelledBy_fkey" FOREIGN KEY ("cancelledBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TransactionConfirmation" ("cancelledAt", "confirmedAt", "contractNumber", "finalPrice", "id", "registrationId", "status") SELECT "cancelledAt", "confirmedAt", "contractNumber", "finalPrice", "id", "registrationId", "status" FROM "TransactionConfirmation";
DROP TABLE "TransactionConfirmation";
ALTER TABLE "new_TransactionConfirmation" RENAME TO "TransactionConfirmation";
CREATE UNIQUE INDEX "TransactionConfirmation_registrationId_key" ON "TransactionConfirmation"("registrationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
