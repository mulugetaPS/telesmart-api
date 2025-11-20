import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { ImouApiResponse } from '../interfaces/imou-api.interface';

/**
 * IMOU API Helper
 * Handles low-level API communication, signature generation, and request formatting
 */
@Injectable()
export class ImouApiHelper {
  private readonly logger = new Logger(ImouApiHelper.name);
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.appId = this.configService.get<string>('imou.appId') || '';
    this.appSecret = this.configService.get<string>('imou.appSecret') || '';
    const dataCenter = this.configService.get<string>('imou.dataCenter', 'fk');
    this.baseUrl = `https://openapi-${dataCenter}.easy4ip.com`;
  }

  /**
   * Make API call to IMOU service
   * @param endpoint API endpoint path
   * @param params Request parameters
   * @param accessToken Access token (optional)
   */
  async makeApiCall<T>(
    endpoint: string,
    params: Record<string, unknown>,
    accessToken?: string,
  ): Promise<T> {
    const body = {
      id: this.generateRequestId(),
      system: this.generateSystemParams(),
      params: accessToken ? { ...params, token: accessToken } : params,
    };

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<ImouApiResponse<T>>(
          `${this.baseUrl}${endpoint}`,
          body,
          { headers: { 'Content-Type': 'application/json' } },
        ),
      );

      const { result } = data;

      if (result.code !== '0') {
        throw new HttpException(
          `IMOU API Error: ${result.msg} (${result.code})`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(`API call failed: ${endpoint}`, error);
      throw new HttpException(
        'Failed to communicate with IMOU service',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Generate system parameters for IMOU API requests
   */
  private generateSystemParams() {
    const time = Math.floor(Date.now() / 1000);
    const nonce = this.generateNonce();
    const sign = this.calculateSign(time, nonce);

    return {
      ver: '1.0',
      sign: sign,
      appId: this.appId,
      time: time,
      nonce: nonce,
    };
  }

  /**
   * Calculate signature according to IMOU API specification
   * Format: time:{time},nonce:{nonce},appSecret:{appSecret}
   */
  private calculateSign(time: number, nonce: string): string {
    const signTemplate = `time:${time},nonce:${nonce},appSecret:${this.appSecret}`;
    return crypto.createHash('md5').update(signTemplate, 'utf8').digest('hex');
  }

  /**
   * Generate random nonce (32 characters hex)
   */
  private generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}
