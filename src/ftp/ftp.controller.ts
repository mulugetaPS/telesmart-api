import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Patch,
  UseGuards,
  Param,
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
    if (!quotaSize) {
      throw new Error('quotaSize is required');
    }
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

  @Get('quota-info')
  @ApiOperation({
    summary: 'Get quota information for the authenticated user',
  })
  async getMyQuotaInfo(@CurrentUserId() userId: number) {
    return this.ftpService.getQuotaInfo(userId);
  }

  @Get('disk-usage')
  @ApiOperation({
    summary: 'Get disk usage for the authenticated user',
  })
  async getMyDiskUsage(@CurrentUserId() userId: number) {
    const usedBytes = await this.ftpService.calculateDiskUsage(userId);
    return {
      userId,
      usedBytes: usedBytes.toString(),
      usedMB: (Number(usedBytes) / 1024 / 1024).toFixed(2),
      usedGB: (Number(usedBytes) / 1024 / 1024 / 1024).toFixed(2),
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'List all FTP users' })
  async listUsers() {
    return this.ftpService.listFtpUsers();
  }

  @Get('user/:userId/quota-info')
  @ApiOperation({ summary: 'Get quota information for a user' })
  async getQuotaInfo(@Param('userId') userId: string) {
    return this.ftpService.getQuotaInfo(+userId);
  }

  @Get('quota-info/all')
  @ApiOperation({ summary: 'Get quota information for all users' })
  async getAllQuotaInfo() {
    return this.ftpService.getAllQuotaInfo();
  }

  @Get('user/:userId/disk-usage')
  @ApiOperation({ summary: 'Calculate actual disk usage for a user' })
  async getDiskUsage(@Param('userId') userId: string) {
    const usedBytes = await this.ftpService.calculateDiskUsage(+userId);
    return {
      userId: +userId,
      usedBytes: usedBytes.toString(),
      usedMB: (Number(usedBytes) / 1024 / 1024).toFixed(2),
      usedGB: (Number(usedBytes) / 1024 / 1024 / 1024).toFixed(2),
    };
  }
}
