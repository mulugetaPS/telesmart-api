import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

/**
 * DTOs for IMOU Camera Operations
 */

// Live Stream Request
export class LiveStreamRequestDto {
  @ApiProperty({
    description: 'Device ID (serial number)',
    example: 'ABC123456789',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiPropertyOptional({
    description: 'Channel ID (default: 0)',
    example: 0,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  channelId?: number = 0;
}

// Live Stream Response
export class LiveStreamResponseDto {
  @ApiProperty({
    description: 'HLS stream URL',
    example: 'https://example.com/stream.m3u8',
  })
  hls: string;

  @ApiPropertyOptional({
    description: 'RTMP stream URL',
    example: 'rtmp://example.com/live/stream',
  })
  rtmp?: string;

  @ApiPropertyOptional({
    description: 'RTSP stream URL',
    example: 'rtsp://example.com/stream',
  })
  rtsp?: string;

  @ApiPropertyOptional({
    description: 'FLV stream URL',
    example: 'https://example.com/stream.flv',
  })
  flv?: string;
}

// Device Info Response
export class DeviceInfoDto {
  @ApiProperty({
    description: 'Device ID',
    example: 'ABC123456789',
  })
  deviceId: string;

  @ApiProperty({
    description: 'Device name',
    example: 'Front Door Camera',
  })
  name: string;

  @ApiProperty({
    description: 'Device model',
    example: 'IPC-A26HP',
  })
  deviceModel: string;

  @ApiProperty({
    description: 'Device status',
    example: 'online',
    enum: ['online', 'offline'],
  })
  status: string;

  @ApiProperty({
    description: 'Number of channels',
    example: 1,
  })
  channels: number;
}

// Device List Response
export class DeviceListResponseDto {
  @ApiProperty({
    description: 'List of devices',
    type: [DeviceInfoDto],
  })
  deviceList: DeviceInfoDto[];

  @ApiProperty({
    description: 'Total count',
    example: 3,
  })
  count: number;
}
