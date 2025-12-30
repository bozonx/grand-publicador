/*
  Warnings:

  - Added the required column `hashed_token` to the `api_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_api_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashed_token" TEXT NOT NULL,
    "encrypted_token" TEXT NOT NULL,
    "scope_project_ids" TEXT NOT NULL DEFAULT '[]',
    "last_used_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "api_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_api_tokens" ("created_at", "encrypted_token", "id", "last_used_at", "name", "scope_project_ids", "updated_at", "user_id") SELECT "created_at", "encrypted_token", "id", "last_used_at", "name", "scope_project_ids", "updated_at", "user_id" FROM "api_tokens";
DROP TABLE "api_tokens";
ALTER TABLE "new_api_tokens" RENAME TO "api_tokens";
CREATE UNIQUE INDEX "api_tokens_hashed_token_key" ON "api_tokens"("hashed_token");
CREATE INDEX "api_tokens_user_id_idx" ON "api_tokens"("user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
