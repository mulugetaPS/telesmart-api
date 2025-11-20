import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

@Injectable()
export class FtpService {
  private readonly logger = new Logger(FtpService.name);
  private readonly ftpHost: string;
  private readonly ftpPort: string;
  private readonly ftpRoot: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.ftpHost = this.config.get<string>('ftp.host') || '';
    this.ftpPort = this.config.get<string>('ftp.port') || '';
    this.ftpRoot = this.config.get<string>('ftp.root', '/var/ftp');
  }

  /**
   * Generate FTP credentials for a user (called on first device registration)
   * Uses Pure-FTPd with PostgreSQL - no system users needed!
   */
  async generateFtpCredentials(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { ftpUser: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already has FTP credentials
    if (user.ftpUser) {
      this.logger.log(`User ${userId} already has FTP credentials`);
      return {
        ftpUsername: user.ftpUser.username,
        ftpPassword: user.ftpUser.password,
        ftpHost: this.ftpHost,
        ftpPort: this.ftpPort,
        homeDir: user.ftpUser.homeDir,
      };
    }

    // Generate unique FTP username and password
    const ftpUsername = `cam_user_${userId}`;
    const ftpPassword = this.generateSecurePassword();
    const homeDir = `${this.ftpRoot}/${ftpUsername}`;

    // Hash password with MD5 crypt format for Pure-FTPd
    const hashedPassword = await this.hashPasswordMd5Crypt(ftpPassword);

    // Create home directory
    try {
      await this.createFtpDirectory(homeDir);
      this.logger.log(`FTP directory created: ${homeDir}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create FTP directory: ${message}`);
      throw new Error('Failed to create FTP directory');
    }

    // Create FTP user in database (Pure-FTPd will authenticate against this)
    const ftpUser = await this.prisma.ftpUser.create({
      data: {
        userId,
        username: ftpUsername,
        password: hashedPassword,
        homeDir,
        uid: 2001,
        gid: 2001,
        quotaSize: BigInt(10737418240), // 10GB default
      },
    });

    this.logger.log(
      `FTP user created in database: ${ftpUsername} (plain password for user: ${ftpPassword})`,
    );

    return {
      ftpUsername: ftpUser.username,
      ftpPassword,
      ftpHost: this.ftpHost,
      ftpPort: this.ftpPort,
      homeDir: ftpUser.homeDir,
    };
  }

  /**
   * Get FTP credentials for a user
   * Note: Password is stored as MD5 hash, cannot be retrieved in plain text
   * User must use the password provided during initial generation
   */
  async getFtpCredentials(userId: number) {
    const ftpUser = await this.prisma.ftpUser.findUnique({
      where: { userId },
    });

    if (!ftpUser) {
      return null;
    }

    return {
      ftpUsername: ftpUser.username,
      ftpPassword: '***hidden***',
      ftpHost: this.ftpHost,
      ftpPort: this.ftpPort,
      homeDir: ftpUser.homeDir,
      isActive: ftpUser.isActive,
      quotaSize: ftpUser.quotaSize.toString(),
      lastLoginAt: ftpUser.lastLoginAt,
    };
  }

  /**
   * Generate secure random password
   */
  private generateSecurePassword(): string {
    const length = this.config.get<number>('ftp.passwordLength') || 16;
    return crypto.randomBytes(length).toString('base64').slice(0, length);
  }

  /**
   * Hash password using MD5 crypt format for Pure-FTPd
   * Uses openssl to generate MD5 crypt hash ($1$salt$hash)
   */
  private async hashPasswordMd5Crypt(password: string): Promise<string> {
    try {
      // Use openssl to generate MD5 crypt hash
      const { stdout } = await execAsync(
        `openssl passwd -1 "${password.replace(/"/g, '\\"')}"`,
      );
      return stdout.trim();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to hash password: ${message}`);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Create FTP directory for user
   * Creates the home directory and sets proper ownership
   */
  private async createFtpDirectory(homeDir: string): Promise<void> {
    try {
      // Create directory
      await fs.mkdir(homeDir, { recursive: true });

      // Set ownership to ftpuser:ftpuser (UID:GID 2001:2001)
      await execAsync(`sudo chown -R ftpuser:ftpuser "${homeDir}"`);
      await execAsync(`sudo chmod 755 "${homeDir}"`);

      this.logger.log(`FTP directory created and configured: ${homeDir}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error creating FTP directory: ${message}`);
      throw error;
    }
  }

  /**
   * Delete FTP directory
   */
  private async deleteFtpDirectory(homeDir: string): Promise<void> {
    try {
      await execAsync(`sudo rm -rf "${homeDir}"`);
      this.logger.log(`FTP directory deleted: ${homeDir}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error deleting FTP directory: ${message}`);
    }
  }

  /**
   * Delete user FTP credentials and directory
   */
  async deleteFtpCredentials(userId: number): Promise<void> {
    const ftpUser = await this.prisma.ftpUser.findUnique({
      where: { userId },
    });

    if (!ftpUser) {
      return;
    }

    // Delete FTP directory
    try {
      await this.deleteFtpDirectory(ftpUser.homeDir);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      this.logger.error(`Failed to delete FTP directory: ${ftpUser.homeDir}`);
    }

    // Delete from database
    await this.prisma.ftpUser.delete({
      where: { userId },
    });

    this.logger.log(`FTP user deleted: ${ftpUser.username}`);
  }

  /**
   * Regenerate FTP credentials for a user
   * Creates new password and updates database
   */
  async regenerateFtpCredentials(userId: number) {
    const ftpUser = await this.prisma.ftpUser.findUnique({
      where: { userId },
    });

    if (!ftpUser) {
      throw new Error('FTP user not found');
    }

    // Generate new password
    const newPassword = this.generateSecurePassword();
    const hashedPassword = await this.hashPasswordMd5Crypt(newPassword);

    // Update in database
    await this.prisma.ftpUser.update({
      where: { userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`FTP password regenerated for user: ${ftpUser.username}`);

    return {
      ftpUsername: ftpUser.username,
      ftpPassword: newPassword, // Return new plain password
      ftpHost: this.ftpHost,
      ftpPort: this.ftpPort,
      homeDir: ftpUser.homeDir,
    };
  }

  /**
   * Update FTP user quota
   */
  async updateQuota(userId: number, quotaSize: bigint): Promise<void> {
    await this.prisma.ftpUser.update({
      where: { userId },
      data: { quotaSize },
    });

    this.logger.log(`FTP quota updated for user ${userId}: ${quotaSize} bytes`);
  }

  /**
   * Disable/Enable FTP user
   */
  async setUserActive(userId: number, isActive: boolean): Promise<void> {
    await this.prisma.ftpUser.update({
      where: { userId },
      data: { isActive },
    });

    this.logger.log(`FTP user ${userId} ${isActive ? 'enabled' : 'disabled'}`);
  }

  /**
   * Calculate actual disk usage for a user's FTP directory
   * Returns size in bytes
   */
  async calculateDiskUsage(userId: number): Promise<bigint> {
    const ftpUser = await this.prisma.ftpUser.findUnique({
      where: { userId },
    });

    if (!ftpUser) {
      throw new Error('FTP user not found');
    }

    try {
      // Use du command to get directory size in bytes
      const { stdout } = await execAsync(
        `du -sb "${ftpUser.homeDir}" | cut -f1`,
      );
      const sizeInBytes = BigInt(stdout.trim());

      this.logger.log(
        `Disk usage for ${ftpUser.username}: ${sizeInBytes} bytes`,
      );

      return sizeInBytes;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to calculate disk usage: ${message}`);
      return BigInt(0);
    }
  }

  /**
   * Get quota information for a user
   * Returns quota limit, used space, and available space
   */
  async getQuotaInfo(userId: number) {
    const ftpUser = await this.prisma.ftpUser.findUnique({
      where: { userId },
    });

    if (!ftpUser) {
      throw new Error('FTP user not found');
    }

    const usedBytes = await this.calculateDiskUsage(userId);
    const quotaBytes = ftpUser.quotaSize;
    const availableBytes = quotaBytes - usedBytes;
    const usagePercentage =
      quotaBytes > 0 ? Number((usedBytes * BigInt(100)) / quotaBytes) : 0;

    return {
      username: ftpUser.username,
      quotaLimit: quotaBytes.toString(),
      quotaLimitGB: (Number(quotaBytes) / 1024 / 1024 / 1024).toFixed(2),
      usedBytes: usedBytes.toString(),
      usedGB: (Number(usedBytes) / 1024 / 1024 / 1024).toFixed(2),
      availableBytes: availableBytes.toString(),
      availableGB: (Number(availableBytes) / 1024 / 1024 / 1024).toFixed(2),
      usagePercentage: usagePercentage.toFixed(2),
      isOverQuota: usedBytes > quotaBytes,
    };
  }
}
