import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FtpService } from '../ftp/ftp.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(
    private prisma: PrismaService,
    private ftpService: FtpService,
  ) {}

  /**
   * Register a new device for a user
   */
  async registerDevice(userId: number, registerDeviceDto: RegisterDeviceDto) {
    const { deviceId, name, deviceModel, bindCode, permissions } =
      registerDeviceDto;

    // Check if device already exists for this user
    const existingDevice = await this.prisma.device.findUnique({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
    });

    if (existingDevice) {
      throw new ConflictException('Device already registered for this user');
    }

    // Create device
    const device = await this.prisma.device.create({
      data: {
        userId,
        deviceId,
        name,
        deviceModel,
        bindCode,
        permissions: permissions || [],
        status: 'offline',
      },
    });

    // Generate FTP credentials for the device
    const ftpCredentials = await this.ftpService.generateFtpCredentials(
      device.id,
    );

    this.logger.log(`Device registered: ${deviceId} for user ${userId}`);

    return {
      ...device,
      ftpCredentials,
    };
  }

  /**
   * Get all devices for a user
   */
  async getUserDevices(userId: number) {
    return this.prisma.device.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { videos: true },
        },
      },
    });
  }

  /**
   * Get single device by ID
   */
  async getDeviceById(deviceId: number) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        _count: {
          select: { videos: true },
        },
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return device;
  }

  /**
   * Get device by deviceId and userId
   */
  async getDeviceByDeviceId(userId: number, deviceId: string) {
    const device = await this.prisma.device.findUnique({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
      include: {
        _count: {
          select: { videos: true },
        },
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return device;
  }

  /**
   * Update device information
   */
  async updateDevice(deviceId: number, updateDeviceDto: UpdateDeviceDto) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    const updated = await this.prisma.device.update({
      where: { id: deviceId },
      data: updateDeviceDto,
    });

    this.logger.log(`Device updated: ${deviceId}`);
    return updated;
  }

  /**
   * Update device status (online/offline)
   */
  async updateDeviceStatus(deviceId: number, status: string) {
    return this.prisma.device.update({
      where: { id: deviceId },
      data: { status },
    });
  }

  /**
   * Remove device
   */
  async removeDevice(deviceId: number) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        _count: {
          select: { videos: true },
        },
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // Delete FTP credentials and system user
    try {
      await this.ftpService.deleteFtpCredentials(deviceId);
      this.logger.log(`FTP user deleted for device: ${device.deviceId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete FTP user: : ${message}`);
      // Continue with device deletion even if FTP user deletion fails
    }

    // Delete device (cascade will delete videos)
    await this.prisma.device.delete({
      where: { id: deviceId },
    });

    this.logger.log(
      `Device removed: ${device.deviceId} (${device._count.videos} videos deleted)`,
    );

    return {
      message: 'Device removed successfully',
      videosDeleted: device._count.videos,
    };
  }

  /**
   * Get device statistics
   */
  async getDeviceStats(deviceId: number) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    const [videoCount, totalSize, latestVideo] = await Promise.all([
      this.prisma.video.count({
        where: { deviceId },
      }),
      this.prisma.video.aggregate({
        where: { deviceId },
        _sum: { filesize: true },
      }),
      this.prisma.video.findFirst({
        where: { deviceId },
        orderBy: { recordedAt: 'desc' },
      }),
    ]);

    return {
      device,
      stats: {
        totalVideos: videoCount,
        totalStorageBytes: totalSize._sum.filesize || BigInt(0),
        totalStorageGB:
          Number(totalSize._sum.filesize || BigInt(0)) / (1024 * 1024 * 1024),
        latestVideo: latestVideo
          ? {
              filename: latestVideo.filename,
              recordedAt: latestVideo.recordedAt,
            }
          : null,
      },
    };
  }
}
