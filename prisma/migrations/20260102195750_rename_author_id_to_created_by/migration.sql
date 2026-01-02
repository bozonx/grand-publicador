/*
  Warnings:

  - You are about to drop the column `author_id` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `author_id` on the `publications` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publication_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "social_media" TEXT NOT NULL,
    "scheduled_at" DATETIME,
    "published_at" DATETIME,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "archived_at" DATETIME,
    "archived_by" TEXT,
    "title" TEXT,
    "description" TEXT,
    "author_comment" TEXT,
    "content" TEXT,
    "tags" TEXT,
    "media_files" TEXT NOT NULL DEFAULT '[]',
    "meta" TEXT NOT NULL DEFAULT '{}',
    "post_type" TEXT NOT NULL,
    "post_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "language" TEXT NOT NULL DEFAULT 'ru-RU',
    CONSTRAINT "posts_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publications" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "posts_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "posts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_posts" ("archived_at", "archived_by", "author_comment", "channel_id", "content", "created_at", "description", "id", "language", "media_files", "meta", "post_date", "post_type", "publication_id", "published_at", "scheduled_at", "social_media", "status", "tags", "title", "updated_at") SELECT "archived_at", "archived_by", "author_comment", "channel_id", "content", "created_at", "description", "id", "language", "media_files", "meta", "post_date", "post_type", "publication_id", "published_at", "scheduled_at", "social_media", "status", "tags", "title", "updated_at" FROM "posts";
DROP TABLE "posts";
ALTER TABLE "new_posts" RENAME TO "posts";
CREATE INDEX "posts_status_scheduled_at_idx" ON "posts"("status", "scheduled_at");
CREATE INDEX "posts_channel_id_created_at_idx" ON "posts"("channel_id", "created_at");
CREATE INDEX "posts_publication_id_idx" ON "posts"("publication_id");
CREATE TABLE "new_publications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "translation_group_id" TEXT,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "archived_at" DATETIME,
    "archived_by" TEXT,
    "title" TEXT,
    "description" TEXT,
    "content" TEXT NOT NULL,
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
INSERT INTO "new_publications" ("archived_at", "archived_by", "author_comment", "content", "created_at", "description", "id", "language", "media_files", "meta", "post_date", "post_type", "project_id", "status", "tags", "title", "translation_group_id", "updated_at") SELECT "archived_at", "archived_by", "author_comment", "content", "created_at", "description", "id", "language", "media_files", "meta", "post_date", "post_type", "project_id", "status", "tags", "title", "translation_group_id", "updated_at" FROM "publications";
DROP TABLE "publications";
ALTER TABLE "new_publications" RENAME TO "publications";
CREATE INDEX "publications_translation_group_id_idx" ON "publications"("translation_group_id");
CREATE INDEX "publications_project_id_status_idx" ON "publications"("project_id", "status");
CREATE INDEX "publications_project_id_created_at_idx" ON "publications"("project_id", "created_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
