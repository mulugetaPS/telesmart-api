import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { FtpService } from './ftp.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';

@ApiTags('FTP')
@Controller('ftp')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FtpController {
  constructor(private readonly ftpService: FtpService) {}

  @Get('credentials')
  @ApiOperation({ summary: 'Get FTP credentials for the authenticated user' })
  async getCredentials(@CurrentUserId() userId: number) {
    return this.ftpService.getFtpCredentials(userId);
  }

  @Post('credentials/generate')
  @ApiOperation({
    summary: 'Generate FTP credentials for the authenticated user',
  })
  async generateCredentials(@CurrentUserId() userId: number) {
    return this.ftpService.generateFtpCredentials(userId);
  }

  @Post('credentials/regenerate')
  @ApiOperation({
    summary: 'Regenerate FTP credentials for the authenticated user',
  })
  async regenerateCredentials(@CurrentUserId() userId: number) {
    return this.ftpService.regenerateFtpCredentials(userId);
  }

  @Delete('credentials')
  @ApiOperation({
    summary: 'Delete FTP credentials for the authenticated user',
  })
  async deleteCredentials(@CurrentUserId() userId: number) {
    await this.ftpService.deleteFtpCredentials(userId);
    return { message: 'FTP credentials deleted successfully' };
  }

  @Patch('quota')
  @ApiOperation({ summary: 'Update FTP user quota' })
  async updateQuota(
    @CurrentUserId() userId: number,
    @Body('quotaSize') quotaSize: string,
  ) {
    await this.ftpService.updateQuota(userId, BigInt(quotaSize));
    return { message: 'Quota updated successfully' };
  }

  @Patch('active')
  @ApiOperation({ summary: 'Enable or disable FTP user' })
  async setActive(
    @CurrentUserId() userId: number,
    @Body('isActive') isActive: boolean,
  ) {
    await this.ftpService.setUserActive(userId, isActive);
    return { message: `User ${isActive ? 'enabled' : 'disabled'}` };
  }

  @Get('users')
  @ApiOperation({ summary: 'List all FTP users' })
  async listUsers() {
    return this.ftpService.listFtpUsers();
  }
}
