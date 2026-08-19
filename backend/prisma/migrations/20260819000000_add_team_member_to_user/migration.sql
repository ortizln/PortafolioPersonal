-- Migration: Add teamMemberId to users table
ALTER TABLE "users" ADD COLUMN "teamMemberId" TEXT;
ALTER TABLE "users" ADD CONSTRAINT "users_teamMemberId_key" UNIQUE ("teamMemberId");
ALTER TABLE "users" ADD CONSTRAINT "users_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
