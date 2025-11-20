import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImouSubAccountService } from '../imou/services/imou-sub-account.service';
import { ImouDeviceService } from '../imou/services/imou-device.service';

@Injectable()
export class CameraService {
  private readonly logger = new Logger(CameraService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly imouSubAccountService: ImouSubAccountService,
    private readonly imouDeviceService: ImouDeviceService,
  ) { }



  /**
   * Verify user has access to device
   * @param userId User ID
   * @param deviceId Device serial number
   */
  private async verifyDeviceAccess(
    userId: number,
    deviceId: string,
  ): Promise<void> {
    const device = await this.prisma.device.findFirst({
      where: {
        userId: userId,
        deviceId: deviceId,
      },
    });

    if (!device) {
      throw new NotFoundException(
        'Device not found or not associated with this user',
      );
    }
  }
}
