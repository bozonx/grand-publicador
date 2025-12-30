-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publication_id" TEXT,
    "channel_id" TEXT NOT NULL,
    "author_id" TEXT,
    "content" TEXT,
    "social_media" TEXT NOT NULL,
    "post_type" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "author_comment" TEXT,
    "tags" TEXT,
    "media_files" TEXT NOT NULL DEFAULT '[]',
    "post_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" DATETIME,
    "published_at" DATETIME,
    "meta" TEXT NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "posts_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publications" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "posts_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_posts" ("author_comment", "author_id", "channel_id", "content", "created_at", "description", "id", "media_files", "meta", "post_date", "post_type", "publication_id", "published_at", "scheduled_at", "social_media", "status", "tags", "title", "updated_at") SELECT "author_comment", "author_id", "channel_id", "content", "created_at", "description", "id", "media_files", "meta", "post_date", "post_type", "publication_id", "published_at", "scheduled_at", "social_media", "status", "tags", "title", "updated_at" FROM "posts";
DROP TABLE "posts";
ALTER TABLE "new_posts" RENAME TO "posts";
CREATE INDEX "posts_status_scheduled_at_idx" ON "posts"("status", "scheduled_at");
CREATE INDEX "posts_channel_id_created_at_idx" ON "posts"("channel_id", "created_at");
CREATE INDEX "posts_publication_id_idx" ON "posts"("publication_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "users_telegram_username_idx" ON "users"("telegram_username");
