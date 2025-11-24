import { Injectable, Logger } from '@nestjs/common';
import { ImouApiHelper } from '../helpers/imou-api.helper';
import { SubAccountTokenManagerService } from './sub-account-token-manager.service';
import { BindDeviceLiveResult } from '../interfaces/imou-api.interface';

/**
 * IMOU Live Service
 * Handles live stream operations
 */
@Injectable()
export class ImouLiveService {
    private readonly logger = new Logger(ImouLiveService.name);

    constructor(
        private readonly apiHelper: ImouApiHelper,
        private readonly tokenManager: SubAccountTokenManagerService,
    ) { }

    /**
     * Create live broadcast (stream) address for a device channel
     * Rate limit: 10,000 calls/day
     * 
     * ⚠️ Warning: Once the live broadcast address is generated, others may use it to view the video.
     * The address will be deleted automatically when the device is unbound.
     * 
     * @param openid User's openid
     * @param deviceId Device serial number
     * @param channelId Channel number on the device (default: "0")
     * @param streamId Stream type: 0 = HD main, 1 = SD auxiliary (default: 1)
     * @param liveMode Mode of live stream, default is "proxy" (default: "proxy")
     * @returns Live stream information with URL, token, and status
     */
    async bindDeviceLive(
        openid: string,
        deviceId: string,
        channelId: string = "0",
        streamId: number = 1,
        liveMode: string = "proxy",
    ): Promise<{ code: string; msg: string; data: BindDeviceLiveResult }> {
        this.logger.log(`Creating live stream for device: ${deviceId}, channel: ${channelId}, stream: ${streamId}`);

        const userToken = await this.tokenManager.getTokenByOpenId(openid);

        const result = await this.apiHelper.makeApiCall<BindDeviceLiveResult>(
            '/openapi/bindDeviceLive',
            { deviceId, channelId, streamId, liveMode },
            userToken,
        );

        return result;
    }
}
