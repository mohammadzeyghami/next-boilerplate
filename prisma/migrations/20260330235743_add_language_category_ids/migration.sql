-- AlterTable
ALTER TABLE "Language" ADD COLUMN     "categoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
