import { Controller, Get, Post, Param } from '@nestjs/common';
import { FtpService } from './ftp.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('FTP')
@Controller('ftp')
export class FtpController {
  constructor(private readonly ftpService: FtpService) {}

  @Get('user/:userId/credentials')
  @ApiOperation({ summary: 'Get FTP credentials for a user' })
  async getCredentials(@Param('userId') userId: string) {
    return this.ftpService.getFtpCredentials(+userId);
  }

  @Post('user/:userId/credentials/generate')
  @ApiOperation({ summary: 'Generate FTP credentials for a user' })
  async generateCredentials(@Param('userId') userId: string) {
    return this.ftpService.generateFtpCredentials(+userId);
  }

  @Post('user/:userId/credentials/regenerate')
  @ApiOperation({ summary: 'Regenerate FTP credentials for a user' })
  async regenerateCredentials(@Param('userId') userId: string) {
    return this.ftpService.regenerateFtpCredentials(+userId);
  }
}
