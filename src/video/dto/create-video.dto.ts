import { IsInt, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVideoDto {
  @ApiProperty({ description: 'Device ID' })
  @IsInt()
  deviceId: number;

  @ApiProperty({ description: 'Video filename' })
  @IsString()
  filename: string;

  @ApiProperty({ description: 'Video file path relative to FTP root' })
  @IsString()
  filepath: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsInt()
  filesize: number;

  @ApiProperty({ description: 'Video duration in seconds', required: false })
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiProperty({ description: 'Recording timestamp', required: false })
  @IsOptional()
  @IsDateString()
  recordedAt?: Date;
}
