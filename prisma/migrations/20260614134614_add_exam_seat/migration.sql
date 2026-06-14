-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ExamRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "building" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "seatCount" INTEGER NOT NULL,
    "facilities" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Arrangement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "examRoomId" TEXT NOT NULL,
    "invigilatorId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "confirmedAt" DATETIME,
    "confirmedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "Arrangement_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Arrangement_examRoomId_fkey" FOREIGN KEY ("examRoomId") REFERENCES "ExamRoom" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Arrangement_invigilatorId_fkey" FOREIGN KEY ("invigilatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Arrangement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "admissionTicket" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "major" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ExamSeat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "examRoomId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "seatNumber" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExamSeat_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExamSeat_examRoomId_fkey" FOREIGN KEY ("examRoomId") REFERENCES "ExamRoom" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExamSeat_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckInRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "arrangementId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "seatNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checkedAt" DATETIME,
    "checkedBy" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CheckInRecord_arrangementId_fkey" FOREIGN KEY ("arrangementId") REFERENCES "Arrangement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CheckInRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CheckInRecord_checkedBy_fkey" FOREIGN KEY ("checkedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Anomaly" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "arrangementId" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "processedBy" TEXT,
    "processedAt" DATETIME,
    "solution" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Anomaly_arrangementId_fkey" FOREIGN KEY ("arrangementId") REFERENCES "Arrangement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Anomaly_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Anomaly_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OperationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TodoItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "relatedId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TodoItem_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Arrangement_examId_idx" ON "Arrangement"("examId");

-- CreateIndex
CREATE INDEX "Arrangement_examRoomId_idx" ON "Arrangement"("examRoomId");

-- CreateIndex
CREATE INDEX "Arrangement_invigilatorId_idx" ON "Arrangement"("invigilatorId");

-- CreateIndex
CREATE INDEX "Arrangement_date_startTime_endTime_idx" ON "Arrangement"("date", "startTime", "endTime");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_admissionTicket_key" ON "Student"("admissionTicket");

-- CreateIndex
CREATE INDEX "ExamSeat_examId_idx" ON "ExamSeat"("examId");

-- CreateIndex
CREATE INDEX "ExamSeat_examRoomId_idx" ON "ExamSeat"("examRoomId");

-- CreateIndex
CREATE INDEX "ExamSeat_studentId_idx" ON "ExamSeat"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSeat_examId_examRoomId_studentId_key" ON "ExamSeat"("examId", "examRoomId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSeat_examId_examRoomId_seatNumber_key" ON "ExamSeat"("examId", "examRoomId", "seatNumber");

-- CreateIndex
CREATE INDEX "CheckInRecord_arrangementId_idx" ON "CheckInRecord"("arrangementId");

-- CreateIndex
CREATE INDEX "CheckInRecord_studentId_idx" ON "CheckInRecord"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckInRecord_arrangementId_studentId_key" ON "CheckInRecord"("arrangementId", "studentId");

-- CreateIndex
CREATE INDEX "Anomaly_arrangementId_idx" ON "Anomaly"("arrangementId");

-- CreateIndex
CREATE INDEX "Anomaly_status_idx" ON "Anomaly"("status");

-- CreateIndex
CREATE INDEX "OperationLog_userId_idx" ON "OperationLog"("userId");

-- CreateIndex
CREATE INDEX "OperationLog_entityType_entityId_idx" ON "OperationLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "OperationLog_createdAt_idx" ON "OperationLog"("createdAt");

-- CreateIndex
CREATE INDEX "TodoItem_assigneeId_idx" ON "TodoItem"("assigneeId");

-- CreateIndex
CREATE INDEX "TodoItem_status_idx" ON "TodoItem"("status");
