import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ImouApiHelper } from '../helpers/imou-api.helper';
import {
  AccessTokenResult,
  TokenCache,
} from '../interfaces/imou-api.interface';

/**
 * IMOU Admin Service
 * Handles administrator authentication and token management
 */
@Injectable()
export class ImouAdminService {
  private readonly logger = new Logger(ImouAdminService.name);
  private adminTokenCache: TokenCache | null = null;

  constructor(private readonly apiHelper: ImouApiHelper) {}

  /**
   * Get administrative access token (with caching)
   */
  async getAdminAccessToken(): Promise<string> {
    if (this.isTokenValid(this.adminTokenCache)) {
      return this.adminTokenCache!.token;
    }

    try {
      const response = await this.apiHelper.makeApiCall<AccessTokenResult>(
        '/openapi/accessToken',
        {},
      );

      this.adminTokenCache = {
        token: response.accessToken,
        expireTime: Date.now() + response.expireTime * 1000,
      };

      this.logger.log('Admin access token refreshed');
      return response.accessToken;
    } catch (error) {
      this.logger.error('Failed to get admin access token', error);
      throw new HttpException(
        'Failed to authenticate with IMOU service',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Check if token is valid (not expired with 1 minute buffer)
   */
  private isTokenValid(cache: TokenCache | null): boolean {
    return cache !== null && cache.expireTime > Date.now() + 60000;
  }
}
