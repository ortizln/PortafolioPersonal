-- AlterTable: add corporate columns to projects
ALTER TABLE "projects" ADD COLUMN "slug" TEXT,
ADD COLUMN "clientId" TEXT,
ADD COLUMN "serviceId" TEXT,
ADD COLUMN "projectType" TEXT,
ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN "challenge" TEXT,
ADD COLUMN "solution" TEXT,
ADD COLUMN "results" TEXT,
ADD COLUMN "metrics" JSONB,
ADD COLUMN "isCaseStudy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "seoTitle" TEXT,
ADD COLUMN "seoDescription" TEXT;

-- Backfill slugs for existing projects
UPDATE "projects"
SET "slug" = CASE
  WHEN lower(regexp_replace(regexp_replace("title", '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '')) = ''
    THEN 'proyecto-' || replace("id"::text, '-', '')
  ELSE lower(regexp_replace(regexp_replace("title", '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', ''))
END
WHERE "slug" IS NULL;

-- Make slug unique and NOT NULL
ALTER TABLE "projects" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_clientId_idx" ON "projects"("clientId");

-- CreateIndex
CREATE INDEX "projects_serviceId_idx" ON "projects"("serviceId");

-- CreateIndex
CREATE INDEX "projects_isCaseStudy_idx" ON "projects"("isCaseStudy");

-- CreateTable
CREATE TABLE "project_members" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "role" TEXT,
    "description" TEXT,
    "isLead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_members_projectId_teamMemberId_key" ON "project_members"("projectId", "teamMemberId");

-- CreateIndex
CREATE INDEX "project_members_teamMemberId_idx" ON "project_members"("teamMemberId");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
