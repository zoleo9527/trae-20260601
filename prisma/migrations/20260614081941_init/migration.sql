-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('HALL_MANAGER', 'ACCOUNT_MANAGER', 'OPERATION_SUPERVISOR');

-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('QUEUED', 'ACCEPTED', 'DOCUMENT_CHECKING', 'DUE_DILIGENCE', 'PROCESSING', 'PENDING_AUTHORIZATION', 'AUTHORIZATION_REVIEW', 'AUTHORIZED', 'REJECTED', 'RETURNED', 'COMPLETED', 'CANCELLED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "DocumentIssue" AS ENUM ('MISSING_COPY', 'INCOMPLETE_DUE_DILIGENCE', 'EXPIRED_DOCUMENT', 'SIGNATURE_MISMATCH', 'MISSING_SIGNATURE', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintType" AS ENUM ('PROCESS_TIMEOUT', 'SERVICE_ATTITUDE', 'DOCUMENT_REQUIREMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "AuthorizationResult" AS ENUM ('APPROVED', 'REJECTED', 'RETURNED', 'ESCALATED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "idCard" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "customerLevel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "calledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueueTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessCase" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "amount" DECIMAL(65,30),
    "status" "BusinessStatus" NOT NULL DEFAULT 'QUEUED',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "timeoutWarning" BOOLEAN NOT NULL DEFAULT false,
    "customerId" TEXT NOT NULL,
    "queueTicketId" TEXT,
    "assigneeId" TEXT,
    "acceptorId" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "processingAt" TIMESTAMP(3),
    "authPendingAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentCheck" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "idCardCopy" BOOLEAN NOT NULL DEFAULT false,
    "idCardOriginal" BOOLEAN NOT NULL DEFAULT false,
    "accountBook" BOOLEAN NOT NULL DEFAULT false,
    "proofOfAddress" BOOLEAN NOT NULL DEFAULT false,
    "incomeProof" BOOLEAN NOT NULL DEFAULT false,
    "otherDocs" TEXT,
    "issues" "DocumentIssue"[],
    "issueNote" TEXT,
    "checkedById" TEXT,
    "checkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DueDiligenceRecord" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "pepCheck" BOOLEAN NOT NULL DEFAULT false,
    "sanctionCheck" BOOLEAN NOT NULL DEFAULT false,
    "adverseMedia" BOOLEAN NOT NULL DEFAULT false,
    "sourceOfFunds" TEXT,
    "purpose" TEXT,
    "needsSupplement" BOOLEAN NOT NULL DEFAULT false,
    "supplementNote" TEXT,
    "completedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DueDiligenceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "BusinessStatus",
    "description" TEXT NOT NULL,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorizationReview" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "reviewLevel" INTEGER NOT NULL DEFAULT 1,
    "result" "AuthorizationResult" NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "reviewedById" TEXT NOT NULL,
    "reviewRequestAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isHistorical" BOOLEAN NOT NULL DEFAULT false,
    "parentReviewId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthorizationReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" "ComplaintType" NOT NULL,
    "description" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_idCard_key" ON "Customer"("idCard");

-- CreateIndex
CREATE UNIQUE INDEX "QueueTicket_ticketNumber_key" ON "QueueTicket"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessCase_caseNumber_key" ON "BusinessCase"("caseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessCase_queueTicketId_key" ON "BusinessCase"("queueTicketId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentCheck_caseId_key" ON "DocumentCheck"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "DueDiligenceRecord_caseId_key" ON "DueDiligenceRecord"("caseId");

-- AddForeignKey
ALTER TABLE "BusinessCase" ADD CONSTRAINT "BusinessCase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessCase" ADD CONSTRAINT "BusinessCase_queueTicketId_fkey" FOREIGN KEY ("queueTicketId") REFERENCES "QueueTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessCase" ADD CONSTRAINT "BusinessCase_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessCase" ADD CONSTRAINT "BusinessCase_acceptorId_fkey" FOREIGN KEY ("acceptorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentCheck" ADD CONSTRAINT "DocumentCheck_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "BusinessCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DueDiligenceRecord" ADD CONSTRAINT "DueDiligenceRecord_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "BusinessCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DueDiligenceRecord" ADD CONSTRAINT "DueDiligenceRecord_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "BusinessCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationReview" ADD CONSTRAINT "AuthorizationReview_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "BusinessCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationReview" ADD CONSTRAINT "AuthorizationReview_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationReview" ADD CONSTRAINT "AuthorizationReview_parentReviewId_fkey" FOREIGN KEY ("parentReviewId") REFERENCES "AuthorizationReview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "BusinessCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
