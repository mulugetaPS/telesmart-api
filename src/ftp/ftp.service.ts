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
   * Generate FTP credentials for a device
   */
  async generateFtpCredentials(deviceId: number) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
      include: { user: true },
    });

    if (!device) {
      throw new Error('Device not found');
    }

    // Generate unique FTP username
    const ftpUsername = `cam_${device.userId}_${device.deviceId}`;
    const ftpPassword = this.generateSecurePassword();

    // Create FTP user on the system
    try {
      await this.createSystemFtpUser(ftpUsername, ftpPassword);
      this.logger.log(`FTP system user created: ${ftpUsername}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create FTP system user: ${message}`);
      throw new Error('Failed to create FTP user on system');
    }

    // Update device with FTP credentials
    await this.prisma.device.update({
      where: { id: deviceId },
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
   * Get FTP credentials for a device
   */
  async getFtpCredentials(deviceId: number) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device || !device.ftpUsername || !device.ftpPassword) {
      return null;
    }

    return {
      ftpUsername: device.ftpUsername,
      ftpPassword: this.decryptPassword(device.ftpPassword),
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
    const ftpRoot = this.config.get<string>('ftp.root', '/var/ftp');
    const userDir = `${ftpRoot}/${username}`;

    try {
      // Check if user already exists
      try {
        await execAsync(`id ${username}`);
        this.logger.log(`User ${username} already exists, updating password`);
        // User exists, just update password
        await execAsync(`echo '${username}:${password}' | sudo chpasswd`);
        return;
      } catch {
        // User doesn't exist, create it
      }

      // Create system user with no shell access
      await execAsync(
        `sudo useradd -m -d "${userDir}" -s /usr/sbin/nologin "${username}"`,
      );

      // Set password
      await execAsync(`echo '${username}:${password}' | sudo chpasswd`);

      // Create user directory structure
      await execAsync(`sudo mkdir -p "${userDir}/videos"`);

      // Set ownership
      await execAsync(`sudo chown -R ${username}:${username} "${userDir}"`);

      // Set permissions
      await execAsync(`sudo chmod 755 "${userDir}"`);

      this.logger.log(`FTP user created successfully: ${username}`);
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
    try {
      // Check if user exists
      try {
        await execAsync(`id ${username}`);
      } catch {
        this.logger.log(`User ${username} does not exist, skipping deletion`);
        return;
      }

      // Delete user and home directory
      await execAsync(`sudo userdel -r ${username}`);
      this.logger.log(`FTP user deleted: ${username}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error deleting FTP user: ${message}`);
      throw error;
    }
  }

  /**
   * Delete device FTP credentials and system user
   */
  async deleteFtpCredentials(deviceId: number): Promise<void> {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device || !device.ftpUsername) {
      return;
    }

    // Delete system user
    try {
      await this.deleteSystemFtpUser(device.ftpUsername);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      this.logger.error(`Failed to delete system user: ${device.ftpUsername}`);
    }

    // Clear credentials from database
    await this.prisma.device.update({
      where: { id: deviceId },
      data: {
        ftpUsername: null,
        ftpPassword: null,
      },
    });
  }
}
