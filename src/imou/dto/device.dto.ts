import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetSubAccountDevicesDto {
  @ApiProperty({
    description: 'Page number (starts at 1)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNo?: number;

  @ApiProperty({
    description: 'Page size (default: 10, max: 50)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}

export class GetLiveStreamDto {
  @ApiProperty({
    description: 'User access token',
    example: 'At_00000ad9e6e87f0142eb92e207aec46a',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Device serial number',
    example: 'TESTQWERXXXX',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({
    description: 'Channel ID (default: 0)',
    example: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  channelId?: number;

  @ApiProperty({
    description: 'Stream quality (0 = HD, 1 = SD)',
    example: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  streamId?: number;
}

export class PtzControlDto {
  @ApiProperty({
    description: 'User access token',
    example: 'At_00000ad9e6e87f0142eb92e207aec46a',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Device serial number',
    example: 'TESTQWERXXXX',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({
    description: 'PTZ operation (e.g., UP, DOWN, LEFT, RIGHT)',
    example: 'UP',
  })
  @IsString()
  @IsNotEmpty()
  operation: string;

  @ApiProperty({
    description: 'Channel ID (default: 0)',
    example: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  channelId?: number;

  @ApiProperty({
    description: 'Duration in milliseconds (default: 1000)',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  duration?: number;
}

export class GetDeviceOnlineDto {
  @ApiProperty({
    description: 'User access token (admin or sub-account)',
    example: 'At_00000ad9e6e87f0142eb92e207aec46a',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Device serial number',
    example: 'TESTQWERXXXX',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;
}

export class CheckDeviceBindingDto {
  @ApiProperty({
    description: 'User access token (admin or sub-account)',
    example: 'At_00000ad9e6e87f0142eb92e207aec46a',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Device serial number',
    example: 'TESTQWERXXXX',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;
}

export class BindDeviceDto {
  @ApiProperty({
    description: 'Administrator access token',
    example: 'At_00000ad9e6e87f0142eb92e207aec46a',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Device serial number',
    example: 'TESTQWERXXXX',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({
    description:
      'Device verification code: auth password, 6-digit security code from device label, or empty string',
    example: 'Admin123',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description:
      'Optional encrypted version of code (AES-256-CBC) for better security',
    example: '5ZtW6b0Ttf1zOiFhqynKaA==',
    required: false,
  })
  @IsOptional()
  @IsString()
  encryptCode?: string;
}

export class UnbindDeviceDto {
  @ApiProperty({
    description: 'User access token (admin or sub-account)',
    example: 'At_00000ad9e6e87f0142eb92e207aec46a',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Device serial number',
    example: 'TESTQWERXXXX',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;
}
