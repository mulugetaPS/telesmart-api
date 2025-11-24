import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for binding device live stream
 */
export class BindDeviceLiveDto {
    @ApiProperty({
        description: 'Device serial number',
        example: 'TESTQWERXXXX',
    })
    @IsString()
    deviceId: string;

    @ApiPropertyOptional({
        description: 'Channel number on the device',
        default: '0',
        example: '0',
    })
    @IsOptional()
    @IsString()
    channelId?: string;

    @ApiPropertyOptional({
        description: 'Stream type: 0 = HD main, 1 = SD auxiliary',
        default: 1,
        example: 1,
    })
    @IsOptional()
    @IsNumber()
    streamId?: number;

    @ApiPropertyOptional({
        description: 'Mode of live stream',
        default: 'proxy',
        example: 'proxy',
    })
    @IsOptional()
    @IsString()
    liveMode?: string;
}
