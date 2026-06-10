-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "HotspotArea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "description" TEXT NOT NULL,
    "bikeCount" INTEGER NOT NULL,
    "urgency" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submitterId" TEXT NOT NULL,
    "dispatcherId" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatchedAt" DATETIME,
    "completedAt" DATETIME,
    CONSTRAINT "HotspotArea_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HotspotArea_dispatcherId_fkey" FOREIGN KEY ("dispatcherId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DispatchOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hotspotId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "assigneeId" TEXT,
    "acceptorId" TEXT,
    "acceptedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DispatchOrder_hotspotId_fkey" FOREIGN KEY ("hotspotId") REFERENCES "HotspotArea" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DispatchOrder_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DispatchOrder_acceptorId_fkey" FOREIGN KEY ("acceptorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommentHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hotspotId" TEXT,
    "dispatchId" TEXT,
    "authorId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommentHistory_hotspotId_fkey" FOREIGN KEY ("hotspotId") REFERENCES "HotspotArea" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommentHistory_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "DispatchOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommentHistory_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hotspotId" TEXT,
    "filename" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "placeholderUrl" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_hotspotId_fkey" FOREIGN KEY ("hotspotId") REFERENCES "HotspotArea" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchOrder_orderNo_key" ON "DispatchOrder"("orderNo");
