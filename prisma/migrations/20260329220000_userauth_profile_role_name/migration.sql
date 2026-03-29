-- CreateEnum
CREATE TYPE "ProfileRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- AlterTable
ALTER TABLE "UserAuth" ADD COLUMN "name" TEXT,
ADD COLUMN "profileRole" "ProfileRole" NOT NULL DEFAULT 'USER';

-- Backfill display name and app profile role from User
UPDATE "UserAuth" ua
SET
  "name" = u."name",
  "profileRole" = CASE u."role"::text
    WHEN 'USER' THEN 'USER'::"ProfileRole"
    WHEN 'ADMIN' THEN 'ADMIN'::"ProfileRole"
    WHEN 'SUPER_ADMIN' THEN 'SUPER_ADMIN'::"ProfileRole"
    ELSE 'USER'::"ProfileRole"
  END
FROM "User" u
WHERE ua."userId" = u."id";
