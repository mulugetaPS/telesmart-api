import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Patch,
} from '@nestjs/common';
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

  @Delete('user/:userId/credentials')
  @ApiOperation({ summary: 'Delete FTP credentials for a user' })
  async deleteCredentials(@Param('userId') userId: string) {
    await this.ftpService.deleteFtpCredentials(+userId);
    return { message: 'FTP credentials deleted successfully' };
  }

  @Patch('user/:userId/quota')
  @ApiOperation({ summary: 'Update FTP user quota' })
  async updateQuota(
    @Param('userId') userId: string,
    @Body('quotaSize') quotaSize: string,
  ) {
    await this.ftpService.updateQuota(+userId, BigInt(quotaSize));
    return { message: 'Quota updated successfully' };
  }

  @Patch('user/:userId/active')
  @ApiOperation({ summary: 'Enable or disable FTP user' })
  async setActive(
    @Param('userId') userId: string,
    @Body('isActive') isActive: boolean,
  ) {
    await this.ftpService.setUserActive(+userId, isActive);
    return { message: `User ${isActive ? 'enabled' : 'disabled'}` };
  }

  @Get('users')
  @ApiOperation({ summary: 'List all FTP users' })
  async listUsers() {
    return this.ftpService.listFtpUsers();
  }
}
