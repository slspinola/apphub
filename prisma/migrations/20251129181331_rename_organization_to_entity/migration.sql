/*
  Warnings:

  - You are about to drop the column `organizationId` on the `Membership` table. All the data in the column will be lost.
  - You are about to drop the `Organization` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrganizationInvite` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,entityId]` on the table `Membership` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `entityId` to the `Membership` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Membership" DROP CONSTRAINT "Membership_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationInvite" DROP CONSTRAINT "OrganizationInvite_organizationId_fkey";

-- DropIndex
DROP INDEX "Membership_userId_organizationId_key";

-- AlterTable
ALTER TABLE "Membership" DROP COLUMN "organizationId",
ADD COLUMN     "entityId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Organization";

-- DropTable
DROP TABLE "OrganizationInvite";

-- CreateTable
CREATE TABLE "Entity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntityInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Entity_slug_key" ON "Entity"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "EntityInvite_token_key" ON "EntityInvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "EntityInvite_email_entityId_key" ON "EntityInvite"("email", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_entityId_key" ON "Membership"("userId", "entityId");

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityInvite" ADD CONSTRAINT "EntityInvite_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
