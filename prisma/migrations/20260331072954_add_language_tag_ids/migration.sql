-- AlterTable
ALTER TABLE "Language" ADD COLUMN     "tagIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
