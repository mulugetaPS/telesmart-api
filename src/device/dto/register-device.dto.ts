import { IsString, IsOptional, IsArray, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDeviceDto {
  @ApiProperty({ description: 'Device serial number or unique identifier' })
  @IsString()
  deviceId: string;

  @ApiProperty({ description: 'Device name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Device model', required: false })
  @IsOptional()
  @IsString()
  deviceModel?: string;

  @ApiProperty({ description: 'Device verification code', required: false })
  @IsOptional()
  @IsString()
  bindCode?: string;

  @ApiProperty({
    description: 'Device permissions',
    required: false,
    example: ['Ptz', 'Talk', 'Real', 'Config'],
  })
  @IsOptional()
  @IsArray()
  permissions?: string[];

  @ApiProperty({ description: 'Number of channels', required: false, default: 1 })
  @IsOptional()
  @IsInt()
  channels?: number;
}
