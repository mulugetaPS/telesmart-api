-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "openid" TEXT,
    "accessToken" TEXT,
    "tokenExpireTime" BIGINT,
    "ftpUsername" TEXT,
    "ftpPassword" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "deviceId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "deviceModel" TEXT,
    "status" TEXT,
    "channels" INTEGER NOT NULL DEFAULT 1,
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "filesize" BIGINT NOT NULL,
    "duration" INTEGER,
    "thumbnailPath" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FtpUser" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "uid" INTEGER NOT NULL DEFAULT 2001,
    "gid" INTEGER NOT NULL DEFAULT 2001,
    "homeDir" TEXT NOT NULL,
    "uploadBandwidth" INTEGER NOT NULL DEFAULT 0,
    "downloadBandwidth" INTEGER NOT NULL DEFAULT 0,
    "quotaSize" BIGINT NOT NULL DEFAULT 10737418240,
    "usedBytes" BIGINT NOT NULL DEFAULT 0,
    "quotaFiles" INTEGER NOT NULL DEFAULT 0,
    "storagePlan" TEXT NOT NULL DEFAULT 'free',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FtpUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_openid_key" ON "User"("openid");

-- CreateIndex
CREATE UNIQUE INDEX "User_ftpUsername_key" ON "User"("ftpUsername");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_openid_idx" ON "User"("openid");

-- CreateIndex
CREATE INDEX "Device_userId_idx" ON "Device"("userId");

-- CreateIndex
CREATE INDEX "Device_deviceId_idx" ON "Device"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Device_userId_deviceId_key" ON "Device"("userId", "deviceId");

-- CreateIndex
CREATE INDEX "Video_deviceId_idx" ON "Video"("deviceId");

-- CreateIndex
CREATE INDEX "Video_userId_idx" ON "Video"("userId");

-- CreateIndex
CREATE INDEX "Video_recordedAt_idx" ON "Video"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FtpUser_userId_key" ON "FtpUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FtpUser_username_key" ON "FtpUser"("username");

-- CreateIndex
CREATE INDEX "FtpUser_username_idx" ON "FtpUser"("username");

-- CreateIndex
CREATE INDEX "FtpUser_userId_idx" ON "FtpUser"("userId");

-- CreateIndex
CREATE INDEX "FtpUser_isActive_idx" ON "FtpUser"("isActive");

-- CreateIndex
CREATE INDEX "FtpUser_storagePlan_idx" ON "FtpUser"("storagePlan");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FtpUser" ADD CONSTRAINT "FtpUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
