-- AlterTable
ALTER TABLE "channels" ADD COLUMN "archived_at" DATETIME;
ALTER TABLE "channels" ADD COLUMN "archived_by" DATETIME;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN "archived_at" DATETIME;
ALTER TABLE "posts" ADD COLUMN "archived_by" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "archived_at" DATETIME;
ALTER TABLE "projects" ADD COLUMN "archived_by" TEXT;

-- AlterTable
ALTER TABLE "publications" ADD COLUMN "archived_at" DATETIME;
ALTER TABLE "publications" ADD COLUMN "archived_by" TEXT;
