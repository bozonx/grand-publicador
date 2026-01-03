-- AlterTable
ALTER TABLE "publications" ADD COLUMN "scheduled_at" DATETIME;

-- CreateIndex
CREATE INDEX "publications_project_id_scheduled_at_idx" ON "publications"("project_id", "scheduled_at");
