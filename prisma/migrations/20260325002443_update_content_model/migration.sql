/*
  Warnings:

  - You are about to drop the column `body` on the `Content` table. All the data in the column will be lost.
  - You are about to drop the column `mediaKind` on the `Content` table. All the data in the column will be lost.
  - You are about to drop the column `mediaUrl` on the `Content` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Content` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Content` table. All the data in the column will be lost.
  - Added the required column `name` to the `Content` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `Content` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Content` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ContentAccess" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'SOUND', 'FILE');

-- DropForeignKey
ALTER TABLE "Content" DROP CONSTRAINT "Content_userId_fkey";

-- DropIndex
DROP INDEX "Content_userId_createdAt_idx";

-- AlterTable
ALTER TABLE "Content" DROP COLUMN "body",
DROP COLUMN "mediaKind",
DROP COLUMN "mediaUrl",
DROP COLUMN "title",
DROP COLUMN "userId",
ADD COLUMN     "access" "ContentAccess" NOT NULL DEFAULT 'PRIVATE',
ADD COLUMN     "contentUrl" TEXT,
ADD COLUMN     "isEarnable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "ownerId" TEXT NOT NULL,
ADD COLUMN     "text" TEXT,
ADD COLUMN     "type" "ContentType" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE INDEX "Content_ownerId_createdAt_idx" ON "Content"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "Content_access_createdAt_idx" ON "Content"("access", "createdAt");

-- CreateIndex
CREATE INDEX "Content_type_createdAt_idx" ON "Content"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
