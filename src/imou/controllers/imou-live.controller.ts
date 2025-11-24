import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { ImouLiveService } from '../services/imou-live.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUserOpenId } from '../../auth/decorators/current-user.decorator';
import { BindDeviceLiveDto } from '../dto/live.dto';

/**
 * IMOU Live Controller
 * Handles live stream API endpoints
 */
@ApiTags('IMOU - Live Stream Management')
@Controller('imou/live')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ImouLiveController {
    constructor(private readonly liveService: ImouLiveService) { }

    /**
     * Create live broadcast address for a device
     * POST /imou/live/bind
     */
    @Post('bind')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Create live stream address',
        description:
            'Create a live broadcast (stream) address for a device channel. Returns HLS URL, live token, and stream information. ' +
            '⚠️ Warning: Once generated, others with the URL may view the stream - handle the token and URL securely. ' +
            'The address will be deleted automatically when the device is unbound. Rate limit: 10,000 calls/day.',
    })
    @ApiResponse({
        status: 200,
        description: 'Live stream address created successfully',
    })
    async bindDeviceLive(
        @CurrentUserOpenId() openid: string,
        @Body() dto: BindDeviceLiveDto,
    ) {
        return await this.liveService.bindDeviceLive(
            openid,
            dto.deviceId,
            dto.channelId,
            dto.streamId,
            dto.liveMode,
        );
    }
}
