import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {  QueryVideosDto } from './dto';
import { Prisma } from 'generated/prisma';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  constructor(private prisma: PrismaService) { }

  /**
   * Videos are automatically indexed by FtpWatcherService when cameras upload via FTP
   * No manual creation needed
   */

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
   * Delete video (also deletes physical file)
   */
  async deleteVideo(id: number) {
    const video = await this.prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Delete physical file from FTP directory
    const fullPath = `${process.env.FTP_ROOT || '/var/ftp'}/${video.filepath}`;
    try {
      const fs = await import('fs/promises');
      await fs.unlink(fullPath);
      this.logger.log(`Deleted physical file: ${fullPath}`);
    } catch (error) {
      this.logger.warn(`Failed to delete physical file: ${fullPath}`);
    }

    // Delete from database (FtpWatcherService will handle storage update)
    await this.prisma.video.delete({
      where: { id },
    });

    this.logger.log(`Video deleted: ${video.filename}`);
    return { message: 'Video deleted successfully' };
  }



}
