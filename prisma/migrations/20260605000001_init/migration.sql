-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurements" (
    "id" UUID NOT NULL,
    "flowerName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '扎',
    "supplier" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gradings" (
    "id" UUID NOT NULL,
    "procurementId" UUID NOT NULL,
    "level" TEXT NOT NULL,
    "gradedById" UUID NOT NULL,
    "gradedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anomalyNote" TEXT,
    "remarks" TEXT,

    CONSTRAINT "gradings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_changes" (
    "id" UUID NOT NULL,
    "procurementId" UUID NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "changedById" UUID NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "status_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "procurements_status_idx" ON "procurements"("status");

-- CreateIndex
CREATE INDEX "procurements_urgency_idx" ON "procurements"("urgency");

-- CreateIndex
CREATE UNIQUE INDEX "gradings_procurementId_key" ON "gradings"("procurementId");

-- CreateIndex
CREATE INDEX "gradings_procurementId_idx" ON "gradings"("procurementId");

-- CreateIndex
CREATE INDEX "status_changes_procurementId_idx" ON "status_changes"("procurementId");

-- AddForeignKey
ALTER TABLE "procurements" ADD CONSTRAINT "procurements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gradings" ADD CONSTRAINT "gradings_procurementId_fkey" FOREIGN KEY ("procurementId") REFERENCES "procurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gradings" ADD CONSTRAINT "gradings_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_changes" ADD CONSTRAINT "status_changes_procurementId_fkey" FOREIGN KEY ("procurementId") REFERENCES "procurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_changes" ADD CONSTRAINT "status_changes_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

