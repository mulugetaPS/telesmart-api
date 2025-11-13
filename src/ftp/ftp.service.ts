import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

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
}
