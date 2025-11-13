import { Controller, Get, Post, Param } from '@nestjs/common';
import { FtpService } from './ftp.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('FTP')
@Controller('ftp')
export class FtpController {
  constructor(private readonly ftpService: FtpService) {}

  @Post('credentials/:deviceId')
  @ApiOperation({ summary: 'Generate FTP credentials for a device' })
  async generateCredentials(@Param('deviceId') deviceId: string) {
    return this.ftpService.generateFtpCredentials(+deviceId);
  }

  @Get('credentials/:deviceId')
  @ApiOperation({ summary: 'Get FTP credentials for a device' })
  async getCredentials(@Param('deviceId') deviceId: string) {
    return this.ftpService.getFtpCredentials(+deviceId);
  }
}
