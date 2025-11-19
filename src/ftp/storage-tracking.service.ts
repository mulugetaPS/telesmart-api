import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StorageTrackingService {
  private readonly logger = new Logger(StorageTrackingService.name);

  constructor(private prisma: PrismaService) { }

  /**
   * Calculate and update user's storage usage from Video table
   * This is the most accurate method as it uses actual file records
   */
  async updateUserStorageUsage(userId: number): Promise<bigint> {
    // Sum all video file sizes for this user
    const result = await this.prisma.video.aggregate({
      where: { userId },
      _sum: { filesize: true },
    });

    const usedBytes = result._sum.filesize || BigInt(0);

    // Update FtpUser with current usage
    await this.prisma.ftpUser.update({
      where: { userId },
      data: { usedBytes },
    });

    this.logger.log(
      `Updated storage usage for user ${userId}: ${usedBytes} bytes`,
    );

    return usedBytes;
  }

  /**
   * Increment storage usage when a file is uploaded
   * Note: This is now handled automatically by FtpWatcherService
   */
  async incrementUsage(userId: number, filesize: bigint): Promise<void> {
    const ftpUser = await this.prisma.ftpUser.findUnique({
      where: { userId },
      select: { usedBytes: true },
    });

    if (ftpUser) {
      await this.prisma.ftpUser.update({
        where: { userId },
        data: {
          usedBytes: ftpUser.usedBytes + filesize,
        },
      });

      this.logger.log(
        `Incremented storage for user ${userId} by ${filesize} bytes`,
      );
    }
  }

  /**
   * Decrement storage usage when a file is deleted
   * Note: This is now handled automatically by FtpWatcherService
   */
  async decrementUsage(userId: number, filesize: bigint): Promise<void> {
    const ftpUser = await this.prisma.ftpUser.findUnique({
      where: { userId },
      select: { usedBytes: true },
    });

    if (ftpUser) {
      const newUsedBytes =
        ftpUser.usedBytes > filesize
          ? ftpUser.usedBytes - filesize
          : BigInt(0);

      await this.prisma.ftpUser.update({
        where: { userId },
        data: {
          usedBytes: newUsedBytes,
        },
      });

      this.logger.log(
        `Decremented storage for user ${userId} by ${filesize} bytes`,
      );
    }
  }

  /**
   * Check if user has enough storage space
   */
  async hasStorageSpace(userId: number, requiredBytes: bigint): Promise<boolean> {
    const ftpUser = await this.prisma.ftpUser.findUnique({
      where: { userId },
      select: { usedBytes: true, quotaSize: true },
    });

    if (!ftpUser) {
      return false;
    }

    return ftpUser.usedBytes + requiredBytes <= ftpUser.quotaSize;
  }

  /**
   * Get storage usage statistics for a user
   */
  async getStorageStats(userId: number) {
    const ftpUser = await this.prisma.ftpUser.findUnique({
      where: { userId },
      select: {
        usedBytes: true,
        quotaSize: true,
        storagePlan: true,
      },
    });

    if (!ftpUser) {
      return null;
    }

    const usedBytes = ftpUser.usedBytes;
    const quotaSize = ftpUser.quotaSize;
    const usagePercent = Number((usedBytes * BigInt(100)) / quotaSize);
    const availableBytes = quotaSize - usedBytes;

    return {
      usedBytes: usedBytes.toString(),
      quotaSize: quotaSize.toString(),
      availableBytes: availableBytes.toString(),
      usagePercent,
      storagePlan: ftpUser.storagePlan,
      isNearLimit: usagePercent >= 90,
      isFull: usedBytes >= quotaSize,
    };
  }


}
