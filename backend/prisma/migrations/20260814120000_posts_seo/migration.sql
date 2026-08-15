-- FASE 6: Blog + SEO metadata

-- Enum de estado de publicaciones
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- Posts
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT,
    "coverImage" TEXT,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "authorId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");
CREATE INDEX "posts_status_publishedAt_idx" ON "posts"("status", "publishedAt");
CREATE INDEX "posts_deletedAt_idx" ON "posts"("deletedAt");

-- Categorías de posts
CREATE TABLE "post_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "post_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "post_categories_slug_key" ON "post_categories"("slug");

-- Tags de posts
CREATE TABLE "post_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "post_tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "post_tags_slug_key" ON "post_tags"("slug");

-- Relación posts <-> categorías
CREATE TABLE "post_category_posts" (
    "postId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "post_category_posts_pkey" PRIMARY KEY ("postId", "categoryId")
);

-- Relación posts <-> tags
CREATE TABLE "post_tag_posts" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "post_tag_posts_pkey" PRIMARY KEY ("postId", "tagId")
);

-- SEO metadata por entidad
CREATE TABLE "seo_metadata" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "twitterTitle" TEXT,
    "twitterDescription" TEXT,
    "twitterImage" TEXT,
    "canonical" TEXT,
    "robots" TEXT DEFAULT 'index,follow',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "seo_metadata_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "seo_metadata_entityType_entityId_key" ON "seo_metadata"("entityType", "entityId");
CREATE INDEX "seo_metadata_entityType_idx" ON "seo_metadata"("entityType");

-- Foreign keys
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "post_category_posts" ADD CONSTRAINT "post_category_posts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_category_posts" ADD CONSTRAINT "post_category_posts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "post_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_tag_posts" ADD CONSTRAINT "post_tag_posts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_tag_posts" ADD CONSTRAINT "post_tag_posts_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "post_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
