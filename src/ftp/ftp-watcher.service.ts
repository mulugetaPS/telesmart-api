import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as chokidar from 'chokidar';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Real-time FTP directory watcher
 * Alternative to cron-based indexing - indexes videos immediately when uploaded
 */
@Injectable()
export class FtpWatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FtpWatcherService.name);
  private readonly ftpRoot: string;
  private watcher: chokidar.FSWatcher | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.ftpRoot = this.config.get<string>('ftp.root', '/var/ftp');
  }

  async onModuleInit() {
    this.startWatching();
  }

  async onModuleDestroy() {
    if (this.watcher) {
      await this.watcher.close();
    }
  }

  private startWatching() {
    this.logger.log(`Starting FTP directory watcher: ${this.ftpRoot}`);

    // Watch all video files in FTP directories
    this.watcher = chokidar.watch(`${this.ftpRoot}/*/videos/*.{mp4,avi,mkv,mov}`, {
      persistent: true,
      ignoreInitial: true, // Don't trigger for existing files
      awaitWriteFinish: {
        stabilityThreshold: 2000, // Wait 2s after file stops changing
        pollInterval: 100,
      },
    });

    // File added
    this.watcher.on('add', async (filepath) => {
      await this.handleNewVideo(filepath);
    });

    // File deleted
    this.watcher.on('unlink', async (filepath) => {
      await this.handleDeletedVideo(filepath);
    });

    this.logger.log('FTP directory watcher started');
  }

  private async handleNewVideo(filepath: string) {
    try {
      const filename = path.basename(filepath);
      const relativePath = path.relative(this.ftpRoot, filepath);
      
      // Extract username from path: /var/ftp/cam_user_1/videos/file.mp4
      const pathParts = relativePath.split(path.sep);
      const username = pathParts[0];

      const ftpUser = await this.prisma.ftpUser.findUnique({
        where: { username },
        include: {
          user: {
            include: {
              devices: { select: { id: true } },
            },
          },
        },
      });

      if (!ftpUser || ftpUser.user.devices.length === 0) {
        return;
      }

      const stats = await fs.stat(filepath);

      // Check if already indexed
      const exists = await this.prisma.video.findFirst({
        where: {
          userId: ftpUser.userId,
          filename,
          filepath: relativePath,
        },
      });

      if (!exists) {
        await this.prisma.video.create({
          data: {
            userId: ftpUser.userId,
            deviceId: ftpUser.user.devices[0].id,
            filename,
            filepath: relativePath,
            filesize: BigInt(stats.size),
            recordedAt: stats.mtime,
          },
        });

        // Update storage usage
        await this.prisma.ftpUser.update({
          where: { userId: ftpUser.userId },
          data: {
            usedBytes: {
              increment: BigInt(stats.size),
            },
          },
        });

        this.logger.log(`Indexed new video: ${filename} for user ${ftpUser.userId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle new video ${filepath}: ${error}`);
    }
  }

  private async handleDeletedVideo(filepath: string) {
    try {
      const relativePath = path.relative(this.ftpRoot, filepath);

      const video = await this.prisma.video.findFirst({
        where: { filepath: relativePath },
      });

      if (video) {
        // Update storage usage
        await this.prisma.ftpUser.update({
          where: { userId: video.userId },
          data: {
            usedBytes: {
              decrement: video.filesize,
            },
          },
        });

        // Remove from database
        await this.prisma.video.delete({
          where: { id: video.id },
        });

        this.logger.log(`Removed deleted video: ${video.filename}`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle deleted video ${filepath}: ${error}`);
    }
  }
}
