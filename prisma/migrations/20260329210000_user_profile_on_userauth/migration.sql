-- App-level roles (NextAuth User + APIs)
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- Account status
CREATE TYPE "StatusAccount" AS ENUM ('ACTIVE', 'DEACTIVE', 'SUSPEND');

ALTER TABLE "UserAuth" ADD COLUMN "status_new" "StatusAccount";
UPDATE "UserAuth" SET "status_new" = CASE
  WHEN "status"::text = 'DISABLED' THEN 'DEACTIVE'::"StatusAccount"
  ELSE 'ACTIVE'::"StatusAccount"
END;
ALTER TABLE "UserAuth" DROP COLUMN "status";
ALTER TABLE "UserAuth" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "UserAuth" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"StatusAccount";
ALTER TABLE "UserAuth" ALTER COLUMN "status" SET NOT NULL;

DROP TYPE "AccountStatus";

-- Profile fields on UserAuth (merged from UserProfile; display name stays on User)
ALTER TABLE "UserAuth" ADD COLUMN "lastName" TEXT;
ALTER TABLE "UserAuth" ADD COLUMN "born" TIMESTAMP(3);
ALTER TABLE "UserAuth" ADD COLUMN "metadata" JSONB;
ALTER TABLE "UserAuth" ADD COLUMN "contentIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "User" u
SET
  "name" = COALESCE(u."name", up."displayName"),
  "image" = COALESCE(u."image", up."avatarUrl")
FROM "UserProfile" up
INNER JOIN "UserAuth" ua ON ua.id = up."userAuthId"
WHERE u.id = ua."userId";

UPDATE "UserAuth" ua
SET "metadata" = up."metadata"
FROM "UserProfile" up
WHERE up."userAuthId" = ua.id AND up."metadata" IS NOT NULL;

ALTER TABLE "UserAuth" ADD COLUMN "firebaseId" TEXT;
ALTER TABLE "UserAuth" ADD COLUMN "steamId" TEXT;

CREATE UNIQUE INDEX "UserAuth_firebaseId_key" ON "UserAuth"("firebaseId");
CREATE UNIQUE INDEX "UserAuth_steamId_key" ON "UserAuth"("steamId");

DROP TABLE "UserProfile";
