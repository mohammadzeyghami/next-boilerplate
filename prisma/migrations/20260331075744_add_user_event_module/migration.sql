-- CreateEnum
CREATE TYPE "UserEventActorType" AS ENUM ('USER', 'SYSTEM');

-- CreateTable
CREATE TABLE "UserEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "type" "UserEventActorType" NOT NULL,
    "userId" TEXT NOT NULL,
    "metadata" JSONB,
    "payload" JSONB,
    "context" JSONB,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTypeStatistic" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventTypeStatistic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserEvent_userId_createdAt_idx" ON "UserEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserEvent_eventType_createdAt_idx" ON "UserEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "UserEvent_type_createdAt_idx" ON "UserEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "UserEvent_entityType_entityId_idx" ON "UserEvent"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "EventTypeStatistic_eventType_key" ON "EventTypeStatistic"("eventType");

-- AddForeignKey
ALTER TABLE "UserEvent" ADD CONSTRAINT "UserEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
