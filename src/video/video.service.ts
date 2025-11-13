import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVideoDto, QueryVideosDto } from './dto';
import { Prisma } from 'generated/prisma';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Record video upload in database
   */
  async createVideo(createVideoDto: CreateVideoDto) {
    const { deviceId, filename, filepath, filesize, duration, recordedAt } =
      createVideoDto;

    // Get device to verify it exists and get userId
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // Create video record
    const video = await this.prisma.video.create({
      data: {
        deviceId,
        userId: device.userId,
        filename,
        filepath,
        filesize: BigInt(filesize),
        duration,
        recordedAt: recordedAt || new Date(),
      },
    });

    // Update storage quota
    await this.updateStorageQuota(device.userId, BigInt(filesize));

    this.logger.log(`Video recorded: ${filename} for device ${deviceId}`);
    return video;
  }

  /**
   * Get videos with filters
   */
  async getVideos(query: QueryVideosDto) {
    const {
      deviceId,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = query;

    const where: Prisma.VideoWhereInput = {};
    if (deviceId) where.deviceId = deviceId;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) where.recordedAt.gte = new Date(startDate);
      if (endDate) where.recordedAt.lte = new Date(endDate);
    }

    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        where,
        include: {
          device: {
            select: {
              name: true,
              deviceId: true,
            },
          },
        },
        orderBy: { recordedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.video.count({ where }),
    ]);

    return {
      data: videos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single video by ID
   */
  async getVideoById(id: number) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: {
        device: {
          select: {
            name: true,
            deviceId: true,
          },
        },
      },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return video;
  }

  /**
   * Delete video
   */
  async deleteVideo(id: number) {
    const video = await this.prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Update storage quota
    await this.updateStorageQuota(video.userId, -video.filesize);

    await this.prisma.video.delete({
      where: { id },
    });

    this.logger.log(`Video deleted: ${video.filename}`);
    return { message: 'Video deleted successfully' };
  }

  /**
   * Get storage quota for user
   */
  async getStorageQuota(userId: string) {
    let quota = await this.prisma.storageQuota.findUnique({
      where: { userId },
    });

    if (!quota) {
      quota = await this.prisma.storageQuota.create({
        data: { userId },
      });
    }

    return {
      ...quota,
      usedGB: Number(quota.usedBytes) / (1024 * 1024 * 1024),
      limitGB: Number(quota.limitBytes) / (1024 * 1024 * 1024),
      percentageUsed:
        (Number(quota.usedBytes) / Number(quota.limitBytes)) * 100,
    };
  }

  /**
   * Update storage quota
   */
  private async updateStorageQuota(userId: string, bytesChange: bigint) {
    await this.prisma.storageQuota.upsert({
      where: { userId },
      update: {
        usedBytes: {
          increment: bytesChange,
        },
      },
      create: {
        userId,
        usedBytes: bytesChange > 0 ? bytesChange : BigInt(0),
      },
    });
  }
}
