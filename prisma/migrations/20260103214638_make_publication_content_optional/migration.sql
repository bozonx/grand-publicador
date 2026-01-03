-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_publications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "translation_group_id" TEXT,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" DATETIME,
    "archived_by" TEXT,
    "title" TEXT,
    "description" TEXT,
    "content" TEXT,
    "author_comment" TEXT,
    "tags" TEXT,
    "media_files" TEXT NOT NULL DEFAULT '[]',
    "meta" TEXT NOT NULL DEFAULT '{}',
    "post_type" TEXT NOT NULL DEFAULT 'POST',
    "post_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "language" TEXT NOT NULL DEFAULT 'ru-RU',
    CONSTRAINT "publications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "publications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_publications" ("archived_at", "archived_by", "author_comment", "content", "created_at", "created_by", "description", "id", "language", "media_files", "meta", "post_date", "post_type", "project_id", "status", "tags", "title", "translation_group_id", "updated_at") SELECT "archived_at", "archived_by", "author_comment", "content", "created_at", "created_by", "description", "id", "language", "media_files", "meta", "post_date", "post_type", "project_id", "status", "tags", "title", "translation_group_id", "updated_at" FROM "publications";
DROP TABLE "publications";
ALTER TABLE "new_publications" RENAME TO "publications";
CREATE INDEX "publications_translation_group_id_idx" ON "publications"("translation_group_id");
CREATE INDEX "publications_project_id_status_idx" ON "publications"("project_id", "status");
CREATE INDEX "publications_project_id_created_at_idx" ON "publications"("project_id", "created_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
