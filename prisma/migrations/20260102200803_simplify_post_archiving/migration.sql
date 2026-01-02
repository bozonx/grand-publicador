/*
  Warnings:

  - You are about to drop the column `archived_at` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `archived_by` on the `posts` table. All the data in the column will be lost.

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
    "archived" BOOLEAN NOT NULL DEFAULT false,
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
INSERT INTO "new_posts" ("author_comment", "channel_id", "content", "created_at", "created_by", "description", "id", "language", "media_files", "meta", "post_date", "post_type", "publication_id", "published_at", "scheduled_at", "social_media", "status", "tags", "title", "updated_at") SELECT "author_comment", "channel_id", "content", "created_at", "created_by", "description", "id", "language", "media_files", "meta", "post_date", "post_type", "publication_id", "published_at", "scheduled_at", "social_media", "status", "tags", "title", "updated_at" FROM "posts";
DROP TABLE "posts";
ALTER TABLE "new_posts" RENAME TO "posts";
CREATE INDEX "posts_status_scheduled_at_idx" ON "posts"("status", "scheduled_at");
CREATE INDEX "posts_channel_id_created_at_idx" ON "posts"("channel_id", "created_at");
CREATE INDEX "posts_publication_id_idx" ON "posts"("publication_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
