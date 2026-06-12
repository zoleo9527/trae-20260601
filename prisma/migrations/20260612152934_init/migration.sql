-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "bid_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "bidder_id" TEXT NOT NULL,
    "bidder_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "current_handler_id" TEXT,
    "current_handler_role" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "bid_registrations_current_handler_id_fkey" FOREIGN KEY ("current_handler_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "clarifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registration_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_by_id" TEXT NOT NULL,
    "reviewed_by_id" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "clarifications_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "bid_registrations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "clarifications_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "clarifications_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "clarification_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clarification_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "changed_by_id" TEXT NOT NULL,
    "change_note" TEXT,
    "changed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "clarification_versions_clarification_id_fkey" FOREIGN KEY ("clarification_id") REFERENCES "clarifications" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "clarification_versions_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "operation_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "operation_type" TEXT NOT NULL,
    "operator_id" TEXT NOT NULL,
    "operator_name" TEXT NOT NULL,
    "operator_role" TEXT NOT NULL,
    "previous_status" TEXT,
    "new_status" TEXT,
    "note" TEXT,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "operation_logs_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "operation_logs_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "bid_registrations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "operation_logs_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "clarifications" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rejection_reasons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registration_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "supplementary_note" TEXT,
    "rejected_by_id" TEXT NOT NULL,
    "rejected_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rejection_reasons_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "bid_registrations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rejection_reasons_rejected_by_id_fkey" FOREIGN KEY ("rejected_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "bid_registrations_status_idx" ON "bid_registrations"("status");

-- CreateIndex
CREATE INDEX "bid_registrations_current_handler_id_current_handler_role_idx" ON "bid_registrations"("current_handler_id", "current_handler_role");

-- CreateIndex
CREATE INDEX "bid_registrations_created_at_idx" ON "bid_registrations"("created_at");

-- CreateIndex
CREATE INDEX "clarifications_status_idx" ON "clarifications"("status");

-- CreateIndex
CREATE INDEX "clarifications_registration_id_idx" ON "clarifications"("registration_id");

-- CreateIndex
CREATE INDEX "operation_logs_entity_type_entity_id_idx" ON "operation_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "operation_logs_operator_id_idx" ON "operation_logs"("operator_id");

-- CreateIndex
CREATE INDEX "operation_logs_created_at_idx" ON "operation_logs"("created_at");
