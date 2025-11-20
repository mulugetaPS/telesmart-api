import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ImouDeviceService } from '../services/imou-device.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUserOpenId } from '../../auth/decorators/current-user.decorator';
import {
  GetSubAccountDevicesDto,
  GetLiveStreamDto,
  PtzControlDto,
  GetDeviceOnlineDto,
  CheckDeviceBindingDto,
  UnbindDeviceDto,
  BindDeviceDto,
} from '../dto/device.dto';

@ApiTags('IMOU - Device Management')
@Controller('imou/device')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ImouDeviceController {
  constructor(private readonly deviceService: ImouDeviceService) { }

  @Get('sub-account/list')
  @ApiOperation({
    summary: 'Get sub-account device list',
    description: 'Get list of devices with permissions for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Device list with permissions retrieved successfully',
  })
  async getSubAccountDevices(
    @CurrentUserOpenId() openid: string,
    @Query() dto: GetSubAccountDevicesDto,
  ) {
    const result = await this.deviceService.getSubAccountDeviceList(
      openid,
      dto.pageNo || 1,
      dto.pageSize || 10,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('live-stream')
  @ApiOperation({
    summary: 'Get live stream URL',
    description: 'Get live stream URLs for a device',
  })
  @ApiResponse({
    status: 200,
    description: 'Live stream URLs retrieved successfully',
  })
  async getLiveStream(@Query() dto: GetLiveStreamDto) {
    const result = await this.deviceService.getLiveStreamUrl(
      dto.token,
      dto.deviceId,
      dto.channelId || 0,
      dto.streamId || 0,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('ptz/control')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Control PTZ',
    description: 'Control device PTZ (Pan-Tilt-Zoom) operations',
  })
  @ApiResponse({
    status: 200,
    description: 'PTZ control executed successfully',
  })
  async controlPtz(@Body() dto: PtzControlDto) {
    const result = await this.deviceService.controlPtz(
      dto.token,
      dto.deviceId,
      dto.operation,
      dto.channelId || 0,
      dto.duration || 1000,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('status/online')
  @ApiOperation({
    summary: 'Get device online status',
    description:
      'Query the online status of a device and its channels. Status codes: 0=offline, 1=online, 3=upgrading, 4=sleeping',
  })
  @ApiResponse({
    status: 200,
    description: 'Device online status retrieved successfully',
  })
  async getDeviceOnline(@Query() dto: GetDeviceOnlineDto) {
    const result = await this.deviceService.getDeviceOnlineStatus(
      dto.token,
      dto.deviceId,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('status/binding')
  @ApiOperation({
    summary: 'Check device binding status',
    description:
      'Query whether a device is bound to any account, and whether it is bound to the current account',
  })
  @ApiResponse({
    status: 200,
    description: 'Device binding status retrieved successfully',
  })
  async checkDeviceBinding(@Query() dto: CheckDeviceBindingDto) {
    const result = await this.deviceService.checkDeviceBindingStatus(
      dto.token,
      dto.deviceId,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('bind')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bind device to account',
    description:
      'Bind a device to the current account using its verification code or password. Rate limit: 2,000 calls/day.',
  })
  @ApiResponse({
    status: 200,
    description: 'Device bound successfully',
  })
  async bindDevice(@Body() dto: BindDeviceDto) {
    const result = await this.deviceService.bindDevice(
      dto.token,
      dto.deviceId,
      dto.code,
      dto.encryptCode,
    );
    return {
      success: true,
      message: 'Device bound successfully',
      data: result,
    };
  }

  @Post('unbind')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unbind device from account',
    description:
      'Unbind a device from the current account. After unbinding: alarm messages are deleted immediately, cloud video will expire, and active cloud storage package returns to developer account. Rate limit: 2,000 calls/day.',
  })
  @ApiResponse({
    status: 200,
    description: 'Device unbound successfully',
  })
  async unbindDevice(@Body() dto: UnbindDeviceDto) {
    const result = await this.deviceService.unbindDevice(
      dto.token,
      dto.deviceId,
    );
    return {
      success: true,
      message: 'Device unbound successfully',
      data: result,
    };
  }
}
