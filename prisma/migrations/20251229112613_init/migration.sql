-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "full_name" TEXT,
    "username" TEXT,
    "avatar_url" TEXT,
    "telegram_id" BIGINT,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "blogs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "blogs_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blog_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blog_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blog_members_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "blogs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blog_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blog_id" TEXT NOT NULL,
    "social_media" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel_identifier" TEXT NOT NULL,
    "credentials" TEXT NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "channels_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "blogs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channel_id" TEXT NOT NULL,
    "author_id" TEXT,
    "content" TEXT NOT NULL,
    "social_media" TEXT NOT NULL,
    "post_type" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "author_comment" TEXT,
    "tags" TEXT,
    "media_files" TEXT NOT NULL DEFAULT '[]',
    "post_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduled_at" DATETIME,
    "published_at" DATETIME,
    "meta" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "posts_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "blog_members_blog_id_user_id_key" ON "blog_members"("blog_id", "user_id");
