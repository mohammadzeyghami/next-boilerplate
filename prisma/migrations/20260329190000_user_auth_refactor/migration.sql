-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "AuthOtpType" AS ENUM ('EMAIL', 'PHONE_NUMBER');

-- CreateEnum
CREATE TYPE "AuthValueType" AS ENUM ('Phone', 'Email');

-- CreateTable
CREATE TABLE "UserAuth" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT,
    "username" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,
    "passwordHash" TEXT,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "inviteCode" TEXT NOT NULL,
    "inviterId" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAuth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userAuthId" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userAuthId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- Unique constraints UserAuth
CREATE UNIQUE INDEX "UserAuth_userId_key" ON "UserAuth"("userId");
CREATE UNIQUE INDEX "UserAuth_deviceId_key" ON "UserAuth"("deviceId");
CREATE UNIQUE INDEX "UserAuth_username_key" ON "UserAuth"("username");
CREATE UNIQUE INDEX "UserAuth_email_key" ON "UserAuth"("email");
CREATE UNIQUE INDEX "UserAuth_phoneNumber_key" ON "UserAuth"("phoneNumber");
CREATE UNIQUE INDEX "UserAuth_inviteCode_key" ON "UserAuth"("inviteCode");

-- Indexes UserAuth
CREATE INDEX "UserAuth_email_idx" ON "UserAuth"("email");
CREATE INDEX "UserAuth_phoneNumber_idx" ON "UserAuth"("phoneNumber");
CREATE INDEX "UserAuth_username_idx" ON "UserAuth"("username");
CREATE INDEX "UserAuth_deviceId_idx" ON "UserAuth"("deviceId");

-- UserProfile
CREATE UNIQUE INDEX "UserProfile_userAuthId_key" ON "UserProfile"("userAuthId");

-- RefreshToken
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_userAuthId_idx" ON "RefreshToken"("userAuthId");

-- Backfill UserAuth + UserProfile from existing User rows
INSERT INTO "UserAuth" ("id", "userId", "email", "passwordHash", "inviteCode", "isGuest", "inviterId", "status", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    u.id,
    u.email,
    u."passwordHash",
    'inv_' || replace(u.id::text, '-', '') || '_' || substring(md5(random()::text || u.id::text), 1, 8),
    false,
    NULL,
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User" u;

INSERT INTO "UserProfile" ("id", "userAuthId", "displayName", "avatarUrl", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    ua.id,
    u.name,
    u.image,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "UserAuth" ua
INNER JOIN "User" u ON u.id = ua."userId";

-- FKs
ALTER TABLE "UserAuth" ADD CONSTRAINT "UserAuth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAuth" ADD CONSTRAINT "UserAuth_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "UserAuth"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userAuthId_fkey" FOREIGN KEY ("userAuthId") REFERENCES "UserAuth"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userAuthId_fkey" FOREIGN KEY ("userAuthId") REFERENCES "UserAuth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- User.email optional; drop password from User (now on UserAuth)
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" DROP COLUMN IF EXISTS "passwordHash";
