-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_channels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "social_media" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel_identifier" TEXT NOT NULL,
    "credentials" TEXT NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "archived_at" DATETIME,
    "archived_by" TEXT,
    CONSTRAINT "channels_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_channels" ("archived_at", "archived_by", "channel_identifier", "created_at", "credentials", "id", "is_active", "name", "project_id", "social_media", "updated_at") SELECT "archived_at", "archived_by", "channel_identifier", "created_at", "credentials", "id", "is_active", "name", "project_id", "social_media", "updated_at" FROM "channels";
DROP TABLE "channels";
ALTER TABLE "new_channels" RENAME TO "channels";
CREATE INDEX "channels_project_id_idx" ON "channels"("project_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
