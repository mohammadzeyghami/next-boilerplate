-- CreateTable
CREATE TABLE "Credit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metadata" JSONB,
    "contentTypes" "ContentType"[] DEFAULT ARRAY[]::"ContentType"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditLifeTime" (
    "id" TEXT NOT NULL,
    "creditsId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metadata" JSONB,
    "lifeTime" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditLifeTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCredit" (
    "id" TEXT NOT NULL,
    "creditsId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCreditTimed" (
    "id" TEXT NOT NULL,
    "creditsId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "lifeTime" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCreditTimed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Credit_name_idx" ON "Credit"("name");

-- CreateIndex
CREATE INDEX "CreditLifeTime_creditsId_createdAt_idx" ON "CreditLifeTime"("creditsId", "createdAt");

-- CreateIndex
CREATE INDEX "UserCredit_userId_createdAt_idx" ON "UserCredit"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserCredit_creditsId_userId_key" ON "UserCredit"("creditsId", "userId");

-- CreateIndex
CREATE INDEX "UserCreditTimed_userId_creditsId_createdAt_idx" ON "UserCreditTimed"("userId", "creditsId", "createdAt");

-- AddForeignKey
ALTER TABLE "CreditLifeTime" ADD CONSTRAINT "CreditLifeTime_creditsId_fkey" FOREIGN KEY ("creditsId") REFERENCES "Credit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCredit" ADD CONSTRAINT "UserCredit_creditsId_fkey" FOREIGN KEY ("creditsId") REFERENCES "Credit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCredit" ADD CONSTRAINT "UserCredit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCreditTimed" ADD CONSTRAINT "UserCreditTimed_creditsId_fkey" FOREIGN KEY ("creditsId") REFERENCES "Credit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCreditTimed" ADD CONSTRAINT "UserCreditTimed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
