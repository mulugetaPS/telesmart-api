import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { DeviceService } from './device.service';
import { FtpService } from '../ftp/ftp.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';

@ApiTags('Devices')
@Controller('devices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeviceController {
  constructor(
    private readonly deviceService: DeviceService,
    private readonly ftpService: FtpService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new device for a user' })
  async register(
    @Body() registerDeviceDto: RegisterDeviceDto,
    @CurrentUserId() userId: number,
  ) {
    return this.deviceService.registerDevice(userId, registerDeviceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all devices for the authenticated user' })
  async getUserDevices(@CurrentUserId() userId: number) {
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
}
