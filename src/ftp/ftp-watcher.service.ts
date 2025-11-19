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
    // Index existing files on startup
    await this.indexExistingFiles();
  }

  /**
   * Index existing video files on startup
   */
  private async indexExistingFiles() {
    this.logger.log('Indexing existing video files...');
    
    try {
      const ftpUsers = await this.prisma.ftpUser.findMany({
        where: { isActive: true },
        select: {
          userId: true,
          username: true,
          homeDir: true,
          user: {
            select: {
              devices: { select: { id: true, deviceId: true } },
            },
          },
        },
      });

      for (const ftpUser of ftpUsers) {
        try {
          const files = await fs.readdir(ftpUser.homeDir);
          
          for (const filename of files) {
            if (this.isVideoFile(filename)) {
              const filepath = path.join(ftpUser.homeDir, filename);
              this.logger.log(`Found existing video: ${filepath}`);
              await this.handleNewVideo(filepath);
            }
          }
        } catch (error) {
          // Directory might not exist yet
        }
      }
      
      this.logger.log('Existing files indexed');
    } catch (error) {
      this.logger.error(`Failed to index existing files: ${error}`);
    }
  }

  /**
   * Check if file is a video based on extension
   */
  private isVideoFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return ['.mp4', '.avi', '.mkv', '.mov', '.flv', '.wmv'].includes(ext);
  }

  async onModuleDestroy() {
    if (this.watcher) {
      await this.watcher.close();
    }
  }

  private startWatching() {
    const watchPattern = `${this.ftpRoot}/*/*.{mp4,avi,mkv,mov,flv,wmv}`;
    this.logger.log(`Starting FTP directory watcher: ${this.ftpRoot}`);
    this.logger.log(`Watch pattern: ${watchPattern}`);

    // Watch all video files in user root directories
    // Monitors: /var/ftp/cam_user_1/*.mp4
    this.watcher = chokidar.watch(watchPattern, {
      persistent: true,
      ignoreInitial: false, // Trigger for existing files on startup
      awaitWriteFinish: {
        stabilityThreshold: 2000, // Wait 2s after file stops changing
        pollInterval: 100,
      },
    });

    // Watcher ready
    this.watcher.on('ready', () => {
      this.logger.log('FTP directory watcher is ready and monitoring');
    });

    // File added
    this.watcher.on('add', async (filepath) => {
      this.logger.log(`File detected: ${filepath}`);
      await this.handleNewVideo(filepath);
    });

    // File deleted
    this.watcher.on('unlink', async (filepath) => {
      this.logger.log(`File deleted: ${filepath}`);
      await this.handleDeletedVideo(filepath);
    });

    // Error handling
    this.watcher.on('error', (error) => {
      this.logger.error(`Watcher error: ${error}`);
    });

    this.logger.log('FTP directory watcher started - monitoring user root directories');
  }

  private async handleNewVideo(filepath: string) {
    try {
      const filename = path.basename(filepath);
      const relativePath = path.relative(this.ftpRoot, filepath);
      
      // Extract username from path: /var/ftp/cam_user_1/file.mp4
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
