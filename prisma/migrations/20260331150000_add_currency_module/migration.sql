-- CreateTable
CREATE TABLE "Currency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "metadata" JSONB,
    "contentTypes" "ContentType"[] DEFAULT ARRAY[]::"ContentType"[],
    "defaultValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stableValue" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCurrency" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currencyId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCurrency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Currency_key_key" ON "Currency"("key");

-- CreateIndex
CREATE INDEX "Currency_name_idx" ON "Currency"("name");

-- CreateIndex
CREATE INDEX "UserCurrency_userId_createdAt_idx" ON "UserCurrency"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserCurrency_currencyId_createdAt_idx" ON "UserCurrency"("currencyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserCurrency_userId_currencyId_key" ON "UserCurrency"("userId", "currencyId");

-- AddForeignKey
ALTER TABLE "UserCurrency" ADD CONSTRAINT "UserCurrency_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCurrency" ADD CONSTRAINT "UserCurrency_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
