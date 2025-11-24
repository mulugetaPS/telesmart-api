import { Injectable, Logger } from '@nestjs/common';
import { ImouAdminService } from './imou-admin.service';
import { ImouApiHelper } from '../helpers/imou-api.helper';
import {
  CreateSubAccountResult,
  SubAccountTokenResult,
  SubAccountListResult,
  AddPolicyParams,
} from '../interfaces/imou-api.interface';

/**
 * IMOU Sub-Account Service
 * Handles sub-account management operations
 */
@Injectable()
export class ImouSubAccountService {
  private readonly logger = new Logger(ImouSubAccountService.name);

  constructor(
    private readonly adminService: ImouAdminService,
    private readonly apiHelper: ImouApiHelper,
  ) { }

  /**
   * Create IMOU sub-account
   * @param account User's phone number or email address
   * @returns Sub-account openid
   */
  async createSubAccount(account: string): Promise<{ code: string; msg: string; data: CreateSubAccountResult }> {
    const formattedAccount = `${account}@telesmart.imou`;

    this.logger.log(
      `Creating IMOU sub-account for: ${account} -> ${formattedAccount}`,
    );

    try {
      const adminToken = await this.adminService.getAdminAccessToken();
      const result = await this.apiHelper.makeApiCall<CreateSubAccountResult>(
        '/openapi/createSubAccount',
        { account: formattedAccount },
        adminToken,
      );

      this.logger.log(`Sub-account created successfully: ${result.data.openid}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to create IMOU sub-account for ${account} (formatted: ${formattedAccount}):`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get list of sub-accounts
   * @param pageNo Page number (starts at 1, default: 1)
   * @param pageSize Number of records per page (default: 5, max: 10)
   * @returns List of sub-accounts with pagination info
   */
  async listSubAccounts(
    pageNo: number = 1,
    pageSize: number = 5,
  ): Promise<{ code: string; msg: string; data: SubAccountListResult }> {
    const adminToken = await this.adminService.getAdminAccessToken();
    const result = await this.apiHelper.makeApiCall<SubAccountListResult>(
      '/openapi/listSubAccount',
      { pageNo, pageSize },
      adminToken,
    );
    return result;
  }

  /**
   * Get sub-account access token
   * @param openid Sub-account's openid
   * @returns Access token and expireTime (in seconds)
   */
  async getSubAccountToken(openid: string): Promise<{ code: string; msg: string; data: SubAccountTokenResult }> {
    const adminToken = await this.adminService.getAdminAccessToken();
    const result = await this.apiHelper.makeApiCall<SubAccountTokenResult>(
      '/openapi/subAccountToken',
      { openid },
      adminToken,
    );
    return result;
  }

  /**
   * Delete sub-account and all its permissions
   * @param openid Sub-account's openid to delete
   * @returns void (no data returned on success)
   */
  async deleteSubAccount(openid: string): Promise<{ code: string; msg: string; data: void }> {
    const adminToken = await this.adminService.getAdminAccessToken();
    const result = await this.apiHelper.makeApiCall<void>(
      '/openapi/deleteSubAccount',
      { openid },
      adminToken,
    );

    this.logger.log(`Sub-account deleted: ${openid}`);
    return result;
  }

  /**
   * Add permissions for a sub-account to access specific devices or channels
   * 
   * Permission types:
   * - Real: real-time video access
   * - Ptz: pan-tilt-zoom control
   * - Talk: two-way audio / intercom
   * - Config: configuration access (device settings)
   * 
   * Resource formats:
   * - dev:<deviceId> - permission for all channels of that device
   * - cam:<deviceId>:<channelId> - permission for a specific channel
   * 
   * @param params Object containing openid and policy
   * @param params.openid Sub-account's unique ID
   * @param params.policy Policy object with permission statements
   * @returns void (no additional data returned on success)
   * 
   * @example
   * ```typescript
   * await addPolicy({
   *   openid: '5dd2fe5bc11240a9b5d4fd4474c857c5',
   *   policy: {
   *     statement: [
   *       {
   *         permission: 'Ptz,Talk,Config',
   *         resource: ['dev:469631729', 'cam:544229080:1']
   *       },
   *       {
   *         permission: 'Real',
   *         resource: ['dev:470686804']
   *       }
   *     ]
   *   }
   * });
   * ```
   * 
   * @throws Error if total number of resources exceeds 10 (API limit)
   */
  async addPolicy(params: AddPolicyParams): Promise<{ code: string; msg: string; data: void }> {
    const { openid, policy } = params;

    // Validate resource count (API limit: max 10 devices/channels)
    const totalResources = policy.statement.reduce(
      (count, stmt) => count + stmt.resource.length,
      0,
    );

    if (totalResources > 10) {
      throw new Error(
        `Total resources exceed API limit: ${totalResources} > 10. ` +
        `Please batch your authorizations across multiple requests.`,
      );
    }

    this.logger.log(
      `Adding policy for sub-account ${openid} with ${totalResources} resource(s)`,
    );

    const adminToken = await this.adminService.getAdminAccessToken();
    const result = await this.apiHelper.makeApiCall<void>(
      '/openapi/addPolicy',
      { openid, policy },
      adminToken,
    );

    this.logger.log(
      `Policy successfully added for sub-account: ${openid}`,
    );

    return result;
  }
}
