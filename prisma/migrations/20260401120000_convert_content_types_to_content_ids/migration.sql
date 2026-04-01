-- Semantic change: these modules now store linked Content ids.
ALTER TABLE "Credit" DROP COLUMN "contentTypes";
ALTER TABLE "Credit" ADD COLUMN "contentIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Currency" DROP COLUMN "contentTypes";
ALTER TABLE "Currency" ADD COLUMN "contentIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Meta" DROP COLUMN "contentTypes";
ALTER TABLE "Meta" ADD COLUMN "contentIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
