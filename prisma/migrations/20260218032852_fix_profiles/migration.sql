/*
  Warnings:

  - You are about to drop the column `document` on the `whitelist` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `whitelist` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cc]` on the table `whitelist` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `profiles` table without a default value. This is not possible if the table is not empty.
  - Made the column `document` on table `profiles` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `cc` to the `whitelist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `whitelist` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "whitelist_document_key";

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "email" TEXT NOT NULL,
ALTER COLUMN "document" SET NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE "whitelist" DROP COLUMN "document",
DROP COLUMN "notes",
ADD COLUMN     "cc" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "whitelist_cc_key" ON "whitelist"("cc");
