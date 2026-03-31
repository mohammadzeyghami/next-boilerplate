-- CreateTable
CREATE TABLE "Meta" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "metadata" JSONB,
    "contentTypes" "ContentType"[] DEFAULT ARRAY[]::"ContentType"[],
    "defaultValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMeta" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metaId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMeta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Meta_key_key" ON "Meta"("key");

-- CreateIndex
CREATE INDEX "Meta_name_idx" ON "Meta"("name");

-- CreateIndex
CREATE INDEX "UserMeta_userId_createdAt_idx" ON "UserMeta"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserMeta_metaId_createdAt_idx" ON "UserMeta"("metaId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserMeta_userId_metaId_key" ON "UserMeta"("userId", "metaId");

-- AddForeignKey
ALTER TABLE "UserMeta" ADD CONSTRAINT "UserMeta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMeta" ADD CONSTRAINT "UserMeta_metaId_fkey" FOREIGN KEY ("metaId") REFERENCES "Meta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
