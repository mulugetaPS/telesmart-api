import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class FtpService {
  private readonly logger = new Logger(FtpService.name);
  private readonly ftpHost: string;
  private readonly ftpPort: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.ftpHost = this.config.get<string>('ftp.host') || '';
    this.ftpPort = this.config.get<string>('ftp.port') || '';
  }

  /**
   * Generate FTP credentials for a user (called on first device registration)
   */
  async generateFtpCredentials(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already has FTP credentials
    if (user.ftpUsername && user.ftpPassword) {
      this.logger.log(`User ${userId} already has FTP credentials`);
      return {
        ftpUsername: user.ftpUsername,
        ftpPassword: this.decryptPassword(user.ftpPassword),
        ftpHost: this.ftpHost,
        ftpPort: this.ftpPort,
      };
    }

    // Generate unique FTP username
    const ftpUsername = `cam_user_${userId}`;
    const ftpPassword = this.generateSecurePassword();

    // Create FTP user on the system
    try {
      await this.createSystemFtpUser(ftpUsername, ftpPassword);
      this.logger.log(`FTP system user created: ${ftpUsername} , pass: ${ftpPassword}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create FTP system user: ${message}`);
      throw new Error('Failed to create FTP user on system');
    }

    // Update user with FTP credentials
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ftpUsername,
        ftpPassword: this.encryptPassword(ftpPassword),
      },
    });

    return {
      ftpUsername,
      ftpPassword,
      ftpHost: this.ftpHost,
      ftpPort: this.ftpPort,
    };
  }

  /**
   * Get FTP credentials for a user
   */
  async getFtpCredentials(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.ftpUsername || !user.ftpPassword) {
      return null;
    }

    return {
      ftpUsername: user.ftpUsername,
      ftpPassword: this.decryptPassword(user.ftpPassword),
      ftpHost: this.ftpHost,
      ftpPort: this.ftpPort,
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
   * Encrypt passwordጵ
   */
  private encryptPassword(password: string): string {
    const secret = this.config.get<string>('ftp.encryptionKey');
    if (!secret)
      throw new Error('FTP_ENCRYPTION_KEY environment variable is not set');
    const key = crypto.scryptSync(secret, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt password
   */
  private decryptPassword(encryptedPassword: string): string {
    const secret = this.config.get<string>('ftp.encryptionKey');
    if (!secret)
      throw new Error('FTP_ENCRYPTION_KEY environment variable is not set');
    const key = crypto.scryptSync(secret, 'salt', 32);
    const parts = encryptedPassword.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Create FTP user on the system
   */
  private async createSystemFtpUser(
    username: string,
    password: string,
  ): Promise<void> {
    const scriptPath = this.config.get<string>(
      'ftp.userManagerScript',
      '/usr/local/bin/ftp-user-manager',
    );

    try {
      // Use the FTP user manager script
      const { stdout, stderr } = await execAsync(
        `sudo ${scriptPath} create "${username}" "${password}"`,
      );

      if (stderr && !stderr.includes('already exists')) {
        this.logger.warn(`FTP user creation warning: ${stderr}`);
      }

      this.logger.log(`FTP user created: ${stdout.trim()}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error creating FTP user: ${message}`);
      throw error;
    }
  }

  /**
   * Delete FTP user from the system
   */
  async deleteSystemFtpUser(username: string): Promise<void> {
    const scriptPath = this.config.get<string>(
      'ftp.userManagerScript',
      '/usr/local/bin/ftp-user-manager',
    );

    try {
      // Use the FTP user manager script
      const { stdout } = await execAsync(
        `sudo ${scriptPath} delete "${username}"`,
      );

      this.logger.log(`FTP user deleted: ${stdout.trim()}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error deleting FTP user: ${message}`);
      throw error;
    }
  }

  /**
   * Delete user FTP credentials and system user
   */
  async deleteFtpCredentials(userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.ftpUsername) {
      return;
    }

    // Delete system user
    try {
      await this.deleteSystemFtpUser(user.ftpUsername);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      this.logger.error(`Failed to delete system user: ${user.ftpUsername}`);
    }

    // Clear credentials from database
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ftpUsername: null,
        ftpPassword: null,
      },
    });
  }

  /**
   * Regenerate FTP credentials for a user
   */
  async regenerateFtpCredentials(userId: number) {
    // Delete existing credentials
    await this.deleteFtpCredentials(userId);

    // Generate new credentials
    return this.generateFtpCredentials(userId);
  }
}
