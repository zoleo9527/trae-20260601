-- Create enums first
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF', 'VOLUNTEER');
CREATE TYPE "VolunteerStatus" AS ENUM ('PENDING', 'AUDITING', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "RecruitmentStatus" AS ENUM ('ACTIVE', 'CLOSED', 'CANCELLED');
CREATE TYPE "AuditType" AS ENUM ('APPLICATION_SUBMITTED', 'APPLICATION_ACCEPTED', 'APPLICATION_REJECTED', 'AUDIT_PASSED', 'AUDIT_FAILED', 'STATUS_CHANGED', 'EXCEPTION_RECORDED', 'EXCEPTION_RESOLVED');
CREATE TYPE "TargetType" AS ENUM ('VOLUNTEER', 'RECRUITMENT', 'EXCEPTION');
CREATE TYPE "ExceptionType" AS ENUM ('DOCUMENT_MISSING', 'INFORMATION_INCONSISTENT', 'BACKGROUND_CHECK_FAILED', 'COMPLIANCE_VIOLATION', 'OTHER');
CREATE TYPE "SeverityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "ExceptionStatus" AS ENUM ('PENDING', 'PROCESSING', 'RESOLVED', 'ESCALATED');

-- Create User table
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create RecruitmentRecord table
CREATE TABLE "RecruitmentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT[] NOT NULL,
    "quota" INTEGER NOT NULL,
    "appliedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "RecruitmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RecruitmentRecord_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create Volunteer table
CREATE TABLE "Volunteer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "idCard" TEXT NOT NULL UNIQUE,
    "address" TEXT NOT NULL,
    "education" TEXT NOT NULL,
    "skills" TEXT[] NOT NULL,
    "status" "VolunteerStatus" NOT NULL DEFAULT 'PENDING',
    "applicationId" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recruitmentRecordId" TEXT,
    CONSTRAINT "Volunteer_recruitmentRecordId_fkey" FOREIGN KEY ("recruitmentRecordId") REFERENCES "RecruitmentRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create AuditRecord table
CREATE TABLE "AuditRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditType" "AuditType" NOT NULL,
    "targetType" "TargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "auditorId" TEXT NOT NULL,
    "volunteerId" TEXT,
    "recruitmentId" TEXT,
    "exceptionId" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditRecord_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditRecord_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "Volunteer"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditRecord_recruitmentId_fkey" FOREIGN KEY ("recruitmentId") REFERENCES "RecruitmentRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create ExceptionLog table
CREATE TABLE "ExceptionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exceptionType" "ExceptionType" NOT NULL,
    "severity" "SeverityLevel" NOT NULL,
    "targetType" "TargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "volunteerId" TEXT,
    "recruitmentId" TEXT,
    "description" TEXT NOT NULL,
    "status" "ExceptionStatus" NOT NULL DEFAULT 'PENDING',
    "resolverId" TEXT,
    "resolveComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "ExceptionLog_resolverId_fkey" FOREIGN KEY ("resolverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ExceptionLog_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "Volunteer"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ExceptionLog_recruitmentId_fkey" FOREIGN KEY ("recruitmentId") REFERENCES "RecruitmentRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create IdempotencyKey table
CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "requestData" JSON NOT NULL,
    "responseData" JSON,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL
);

-- Add foreign key for ExceptionLog to AuditRecord
ALTER TABLE "AuditRecord" ADD CONSTRAINT "AuditRecord_exceptionId_fkey" FOREIGN KEY ("exceptionId") REFERENCES "ExceptionLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "RecruitmentRecord_creatorId_idx" ON "RecruitmentRecord"("creatorId");
CREATE INDEX "Volunteer_recruitmentRecordId_idx" ON "Volunteer"("recruitmentRecordId");
CREATE INDEX "Volunteer_status_idx" ON "Volunteer"("status");
CREATE INDEX "AuditRecord_targetType_targetId_idx" ON "AuditRecord"("targetType", "targetId");
CREATE INDEX "AuditRecord_volunteerId_idx" ON "AuditRecord"("volunteerId");
CREATE INDEX "AuditRecord_recruitmentId_idx" ON "AuditRecord"("recruitmentId");
CREATE INDEX "AuditRecord_exceptionId_idx" ON "AuditRecord"("exceptionId");
CREATE INDEX "ExceptionLog_targetType_targetId_idx" ON "ExceptionLog"("targetType", "targetId");
CREATE INDEX "ExceptionLog_severity_status_idx" ON "ExceptionLog"("severity", "status");
CREATE INDEX "IdempotencyKey_key_idx" ON "IdempotencyKey"("key");
CREATE INDEX "IdempotencyKey_expiresAt_idx" ON "IdempotencyKey"("expiresAt");