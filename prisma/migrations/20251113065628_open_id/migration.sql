/*
  Warnings:

  - You are about to drop the column `subAccounttoken` on the `User` table. All the data in the column will be lost.
  - Added the required column `openid` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_subAccounttoken_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "subAccounttoken",
ADD COLUMN     "openid" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "User_openid_idx" ON "User"("openid");
