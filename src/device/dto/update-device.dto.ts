import { IsString, IsOptional, IsArray, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDeviceDto {
  @ApiProperty({ description: 'Device name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Device model', required: false })
  @IsOptional()
  @IsString()
  deviceModel?: string;

  @ApiProperty({ description: 'Device status', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Device verification code', required: false })
  @IsOptional()
  @IsString()
  bindCode?: string;

  @ApiProperty({ description: 'Device permissions', required: false })
  @IsOptional()
  @IsArray()
  permissions?: string[];

  @ApiProperty({ description: 'Number of channels', required: false })
  @IsOptional()
  @IsInt()
  channels?: number;
}
