/*
  Warnings:

  - You are about to drop the `StorageQuota` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "FtpUser" ADD COLUMN     "storagePlan" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN     "usedBytes" BIGINT NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "StorageQuota";

-- CreateIndex
CREATE INDEX "FtpUser_storagePlan_idx" ON "FtpUser"("storagePlan");
