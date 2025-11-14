import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { DeviceService } from './device.service';
import { FtpService } from '../ftp/ftp.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Devices')
@Controller('devices')
export class DeviceController {
  constructor(
    private readonly deviceService: DeviceService,
    private readonly ftpService: FtpService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new device for a user' })
  async register(
    @Body() registerDeviceDto: RegisterDeviceDto,
    @Query('userId') userId: string,
  ) {
    return this.deviceService.registerDevice(userId, registerDeviceDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all devices for a user' })
  async getUserDevices(@Param('userId') userId: string) {
    return this.deviceService.getUserDevices(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get device by ID' })
  async getDevice(@Param('id') id: string) {
    return this.deviceService.getDeviceById(+id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get device statistics' })
  async getDeviceStats(@Param('id') id: string) {
    return this.deviceService.getDeviceStats(+id);
  }

  @Get(':id/ftp-credentials')
  @ApiOperation({ summary: 'Get FTP credentials for device' })
  async getFtpCredentials(@Param('id') id: string) {
    return this.ftpService.getFtpCredentials(+id);
  }

  @Post(':id/ftp-credentials/regenerate')
  @ApiOperation({ summary: 'Regenerate FTP credentials for device' })
  async regenerateFtpCredentials(@Param('id') id: string) {
    return this.ftpService.generateFtpCredentials(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update device information' })
  async update(
    @Param('id') id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.deviceService.updateDevice(+id, updateDeviceDto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update device status' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.deviceService.updateDeviceStatus(+id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove device and all its videos' })
  async remove(@Param('id') id: string) {
    return this.deviceService.removeDevice(+id);
  }
}
