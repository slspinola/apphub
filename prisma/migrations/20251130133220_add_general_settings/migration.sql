-- AlterTable
ALTER TABLE "SystemSettings" ADD COLUMN     "defaultCountry" TEXT NOT NULL DEFAULT 'US',
ADD COLUMN     "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "defaultTimezone" TEXT NOT NULL DEFAULT 'UTC';
