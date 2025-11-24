import { Injectable, Logger } from '@nestjs/common';
import { ImouAdminService } from './imou-admin.service';
import { ImouApiHelper } from '../helpers/imou-api.helper';
import { SubAccountTokenManagerService } from './sub-account-token-manager.service';
import { ImouSubAccountService } from './imou-sub-account.service';
import {
  SubAccountDeviceListResult,
  LiveStreamResult,
  DeviceOnlineResult,
  DeviceBindingStatusResult,
  PtzControlResult,
  UnbindDeviceResult,
  BindDeviceResult,
} from '../interfaces/imou-api.interface';

/**
 * IMOU Device Service
 * Handles device-related operations
 */
@Injectable()
export class ImouDeviceService {
  private readonly logger = new Logger(ImouDeviceService.name);

  constructor(
    private readonly adminService: ImouAdminService,
    private readonly apiHelper: ImouApiHelper,
    private readonly tokenManager: SubAccountTokenManagerService,
    private readonly subAccountService: ImouSubAccountService,
  ) { }

  /**
   * Get list of devices with permissions for a sub-account
   * @param openid Sub-account's openid
   * @param pageNo Page number (starts at 1, default: 1)
   * @param pageSize Number of records per page (default: 10, max: 50)
   * @returns List of device permissions (policy) with pagination info
   */
  async getSubAccountDeviceList(
    openid: string,
    pageNo: number = 1,
    pageSize: number = 10,
  ): Promise<{ code: string; msg: string; data: SubAccountDeviceListResult }> {
    const adminToken = await this.adminService.getAdminAccessToken();
    const result = await this.apiHelper.makeApiCall<SubAccountDeviceListResult>(
      '/openapi/listSubAccountDevice',
      { openid, pageNo, pageSize },
      adminToken,
    );
    return result;
  }

  /**
   * Get live stream URL for a device
   * @param openid User's openid
   * @param deviceId Device serial number
   * @param channelId Channel ID (default: 0)
   * @param streamId Stream quality (0 = HD, 1 = SD)
   */
  async getLiveStreamUrl(
    openid: string,
    deviceId: string,
    channelId: number = 0,
    streamId: number = 0,
  ): Promise<{ code: string; msg: string; data: LiveStreamResult }> {
    const userToken = await this.tokenManager.getTokenByOpenId(openid);
    const result = await this.apiHelper.makeApiCall<LiveStreamResult>(
      '/openapi/live/address/get',
      { deviceId, channelId, streamId },
      userToken,
    );
    return result;
  }

  /**
   * Control PTZ (Pan-Tilt-Zoom)
   * @param openid User's openid
   * @param deviceId Device serial number
   * @param operation PTZ operation
   * @param channelId Channel ID
   * @param duration Duration in milliseconds
   */
  async controlPtz(
    openid: string,
    deviceId: string,
    operation: string,
    channelId: number = 0,
    duration: number = 1000,
  ): Promise<{ code: string; msg: string; data: PtzControlResult }> {
    const userToken = await this.tokenManager.getTokenByOpenId(openid);
    const result = await this.apiHelper.makeApiCall<PtzControlResult>(
      '/openapi/device/ptz/start',
      { deviceId, channelId, operation, duration },
      userToken,
    );
    return result;
  }

  /**
   * Get device online status
   * @param openid User's openid
   * @param deviceId Device serial number
   * @returns Device and channel online status
   */
  async getDeviceOnlineStatus(
    openid: string,
    deviceId: string,
  ): Promise<{ code: string; msg: string; data: DeviceOnlineResult }> {
    const userToken = await this.tokenManager.getTokenByOpenId(openid);
    const result = await this.apiHelper.makeApiCall<DeviceOnlineResult>(
      '/openapi/deviceOnline',
      { deviceId },
      userToken,
    );
    return result;
  }

  /**
   * Check device binding status
   * @param openid User's openid
   * @param deviceId Device serial number
   * @returns Device binding status (isBind, isMine)
   */
  async checkDeviceBindingStatus(
    openid: string,
    deviceId: string,
  ): Promise<{ code: string; msg: string; data: DeviceBindingStatusResult }> {
    const userToken = await this.tokenManager.getTokenByOpenId(openid);
    const result = await this.apiHelper.makeApiCall<DeviceBindingStatusResult>(
      '/openapi/checkDeviceBindOrNot',
      { deviceId },
      userToken,
    );
    return result;
  }

  /**
   * Rate limit: 2,000 calls/day
   * @param openid User's openid
   * @param deviceId Device serial number
   * @returns Unbind operation result
   */
  async unbindDevice(
    openid: string,
    deviceId: string,
  ): Promise<{ code: string; msg: string }> {
    this.logger.log(`Unbinding device: ${deviceId}`);
    const userToken = await this.tokenManager.getTokenByOpenId(openid);
    const result = await this.apiHelper.makeApiCall<UnbindDeviceResult>(
      '/openapi/unBindDevice',
      { deviceId },
      userToken,
    );
    // Return only code and msg, data is duplicate
    return { code: result.code, msg: result.msg };
  }

  /**
   * Rate limit: 2,000 calls/day
   * @param openid User's openid
   * @param deviceId Device serial number
   * @param code Device verification code (auth password, 6-digit security code, or empty string)
   * @param encryptCode Optional encrypted version of code for better security
   * @returns Bind operation result
   */
  async bindDevice(
    openid: string,
    deviceId: string,
    code: string,
    encryptCode?: string,
  ): Promise<{ code: string; msg: string }> {
    this.logger.log(`Binding device: ${deviceId} for sub-account: ${openid}`);

    await this.unbindDevice(openid, deviceId);
    this.logger.log(`Device ${deviceId} unbound successfully before rebinding`);

    const userToken = await this.tokenManager.getTokenByOpenId(openid);
    const params: Record<string, unknown> = { deviceId, code };
    if (encryptCode) {
      params.encryptCode = encryptCode;
    }

    // First attempt to bind the device
    const result = await this.apiHelper.makeApiCall<BindDeviceResult>(
      '/openapi/bindDevice',
      params,
      userToken,
    );

    // Check if error code is SUB1000 (no permission)
    if (result.code === 'SUB1000') {
      this.logger.warn(
        `This account has no permission for device ${deviceId}. ` +
        `Granting permissions and retrying...`,
      );

      // Grant all permissions to the device for this sub-account
      await this.subAccountService.addPolicy({
        openid,
        policy: {
          statement: [
            {
              permission: 'Real,Ptz,Talk,Config',
              resource: [`dev:${deviceId}`],
            },
          ],
        },
      });

      this.logger.log(
        `Permissions granted successfully. Retrying device binding...`,
      );

      // Retry binding after granting permissions
      const retryResult = await this.apiHelper.makeApiCall<BindDeviceResult>(
        '/openapi/bindDevice',
        params,
        userToken,
      );

      // Return only code and msg, data is duplicate
      return { code: retryResult.code, msg: retryResult.msg };
    }

    // Return only code and msg, data is duplicate
    return { code: result.code, msg: result.msg };
  }
}
