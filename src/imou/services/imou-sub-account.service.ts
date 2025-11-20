import { Injectable, Logger } from '@nestjs/common';
import { ImouAdminService } from './imou-admin.service';
import { ImouApiHelper } from '../helpers/imou-api.helper';
import {
  CreateSubAccountResult,
  SubAccountTokenResult,
  SubAccountListResult,
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
  ) {}

  /**
   * Create IMOU sub-account
   * @param account User's phone number or email address
   * @returns Sub-account openid
   */
  async createSubAccount(account: string): Promise<CreateSubAccountResult> {
    const formattedAccount = `${account}@telesmart.imou`;

    this.logger.log(
      `Creating IMOU sub-account for: ${account} -> ${formattedAccount}`,
    );

    try {
      const adminToken = await this.adminService.getAdminAccessToken();
      const response = await this.apiHelper.makeApiCall<CreateSubAccountResult>(
        '/openapi/createSubAccount',
        { account: formattedAccount },
        adminToken,
      );

      this.logger.log(`Sub-account created successfully: ${response.openid}`);
      return response;
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
  ): Promise<SubAccountListResult> {
    const adminToken = await this.adminService.getAdminAccessToken();
    return this.apiHelper.makeApiCall<SubAccountListResult>(
      '/openapi/listSubAccount',
      { pageNo, pageSize },
      adminToken,
    );
  }

  /**
   * Get sub-account access token
   * @param openid Sub-account's openid
   * @returns Access token and expireTime (in seconds)
   */
  async getSubAccountToken(openid: string): Promise<SubAccountTokenResult> {
    const adminToken = await this.adminService.getAdminAccessToken();
    return this.apiHelper.makeApiCall<SubAccountTokenResult>(
      '/openapi/subAccountToken',
      { openid },
      adminToken,
    );
  }

  /**
   * Delete sub-account and all its permissions
   * @param openid Sub-account's openid to delete
   * @returns void (no data returned on success)
   */
  async deleteSubAccount(openid: string): Promise<void> {
    const adminToken = await this.adminService.getAdminAccessToken();
    await this.apiHelper.makeApiCall<void>(
      '/openapi/deleteSubAccount',
      { openid },
      adminToken,
    );

    this.logger.log(`Sub-account deleted: ${openid}`);
  }
}
