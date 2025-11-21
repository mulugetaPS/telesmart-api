import { Injectable, Logger } from '@nestjs/common';
import { ImouAdminService } from './imou-admin.service';
import { ImouApiHelper } from '../helpers/imou-api.helper';
import { SubAccountTokenManagerService } from './sub-account-token-manager.service';
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
  ): Promise<SubAccountDeviceListResult> {
    console.log({ openid })
    const adminToken = await this.adminService.getAdminAccessToken();
    return this.apiHelper.makeApiCall<SubAccountDeviceListResult>(
      '/openapi/listSubAccountDevice',
      { openid, pageNo, pageSize },
      adminToken,
    );
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
  ): Promise<LiveStreamResult> {
    const userToken = await this.tokenManager.getTokenByOpenId(openid);
    return this.apiHelper.makeApiCall<LiveStreamResult>(
      '/openapi/live/address/get',
      { deviceId, channelId, streamId },
      userToken,
    );
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
  ): Promise<PtzControlResult> {
    const userToken = await this.tokenManager.getTokenByOpenId(openid);
    return this.apiHelper.makeApiCall<PtzControlResult>(
      '/openapi/device/ptz/start',
      { deviceId, channelId, operation, duration },
      userToken,
    );
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
  ): Promise<DeviceOnlineResult> {
    const userToken = await this.tokenManager.getTokenByOpenId(openid);
    return this.apiHelper.makeApiCall<DeviceOnlineResult>(
      '/openapi/deviceOnline',
      { deviceId },
      userToken,
    );
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
  ): Promise<DeviceBindingStatusResult> {
    const userToken = await this.tokenManager.getTokenByOpenId(openid);
    return this.apiHelper.makeApiCall<DeviceBindingStatusResult>(
      '/openapi/checkDeviceBindOrNot',
      { deviceId },
      userToken,
    );
  }

  /**
   * Unbind (remove) a device from the current account
   * After unbinding:
   * - Alarm messages are deleted immediately
   * - Cloud video is not deleted immediately but will expire
   * - Active cloud storage package returns to developer account for reuse
   * Rate limit: 2,000 calls/day
   * @param openid User's openid
   * @param deviceId Device serial number
   * @returns Unbind operation result
   */
  async unbindDevice(
    openid: string,
    deviceId: string,
  ): Promise<UnbindDeviceResult> {
    this.logger.log(`Unbinding device: ${deviceId}`);
    const userToken = await this.tokenManager.getTokenByOpenId(openid);
    return this.apiHelper.makeApiCall<UnbindDeviceResult>(
      '/openapi/unBindDevice',
      { deviceId },
      userToken,
    );
  }

  /**
   * Bind a device to an account using its verification code or password
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
  ): Promise<BindDeviceResult> {
    this.logger.log(`Binding device: ${deviceId}`);
    const userToken = await this.tokenManager.getTokenByOpenId(openid);
    const params: Record<string, unknown> = { deviceId, code };
    if (encryptCode) {
      params.encryptCode = encryptCode;
    }
    return this.apiHelper.makeApiCall<BindDeviceResult>(
      '/openapi/bindDevice',
      params,
      userToken,
    );
  }
}
