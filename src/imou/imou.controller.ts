import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { ImouAdminService } from './services/imou-admin.service';
import { ImouSubAccountService } from './services/imou-sub-account.service';
import { ImouDeviceService } from './services/imou-device.service';

@ApiTags('IMOU')
@Controller('imou')
export class ImouController {
  constructor(
    private readonly adminService: ImouAdminService,
    private readonly subAccountService: ImouSubAccountService,
    private readonly deviceService: ImouDeviceService,
  ) { }

  @Get('admin-token')
  @ApiOperation({ summary: 'Get admin access token' })
  @ApiResponse({
    status: 200,
    description: 'Admin token retrieved successfully',
  })
  async getAdminToken() {
    const token = await this.adminService.getAdminAccessToken();
    return {
      success: true,
      accessToken: token,
    };
  }

  @Post('sub-account')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create sub-account' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        account: {
          type: 'string',
          description: 'Phone number or email address',
          example: '1234567890',
        },
      },
      required: ['account'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Sub-account created successfully',
  })
  async createSubAccount(@Body('account') account: string) {
    const result = await this.subAccountService.createSubAccount(account);
    return {
      success: true,
      data: result,
    };
  }

  @Get('sub-accounts')
  @ApiOperation({ summary: 'Get list of sub-accounts' })
  @ApiQuery({
    name: 'pageNo',
    required: false,
    type: Number,
    description: 'Page number (starts at 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Page size (default: 5, max: 10)',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Sub-accounts list retrieved successfully',
  })
  async listSubAccounts(
    @Query('pageNo') pageNo?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const page = pageNo ? parseInt(pageNo, 10) : 1;
    const size = pageSize ? parseInt(pageSize, 10) : 5;
    const result = await this.subAccountService.listSubAccounts(page, size);
    return {
      success: true,
      data: result,
    };
  }

  @Get('sub-account-token')
  @ApiOperation({ summary: 'Get sub-account access token' })
  @ApiQuery({
    name: 'openid',
    required: true,
    type: String,
    description: 'Sub-account openid',
    example: '5dd2fe5bc11240a9b5d4fd4474c857c5',
  })
  @ApiResponse({
    status: 200,
    description: 'Sub-account token retrieved successfully',
  })
  async getSubAccountToken(@Query('openid') openid: string) {
    const result = await this.subAccountService.getSubAccountToken(openid);
    return {
      success: true,
      data: result,
    };
  }

  @Post('sub-account/delete')
  @ApiOperation({
    summary: 'Delete sub-account',
    description:
      'Deletes a sub-account and all its permissions. This operation is irreversible.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        openid: {
          type: 'string',
          description: 'Sub-account openid to delete',
          example: '5dd2fe5bc11240a9b5d4fd4474c857c5',
        },
      },
      required: ['openid'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Sub-account deleted successfully',
  })
  async deleteSubAccount(@Body('openid') openid: string) {
    await this.subAccountService.deleteSubAccount(openid);
    return {
      success: true,
      message: 'Sub-account deleted successfully',
    };
  }

  @Get('sub-account-devices')
  @ApiOperation({ summary: 'Get sub-account device list with permissions' })
  @ApiQuery({
    name: 'openid',
    required: true,
    type: String,
    description: 'Sub-account openid',
    example: '5dd2fe5bc11240a9b5d4fd4474c857c5',
  })
  @ApiQuery({
    name: 'pageNo',
    required: false,
    type: Number,
    description: 'Page number (starts at 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Page size (default: 10, max: 50)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Device list with permissions retrieved successfully',
  })
  async getSubAccountDevices(
    @Query('openid') openid: string,
    @Query('pageNo') pageNo?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const page = pageNo ? parseInt(pageNo, 10) : 1;
    const size = pageSize ? parseInt(pageSize, 10) : 10;
    const result = await this.deviceService.getSubAccountDeviceList(
      openid,
      page,
      size,
    );
    return {
      success: true,
      data: result,
    };
  }



  @Post('ptz-control')
  @ApiOperation({ summary: 'Control PTZ (Pan-Tilt-Zoom)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'User access token',
        },
        deviceId: {
          type: 'string',
          description: 'Device serial number',
        },
        operation: {
          type: 'string',
          description: 'PTZ operation (e.g., UP, DOWN, LEFT, RIGHT)',
          example: 'UP',
        },
        channelId: {
          type: 'number',
          description: 'Channel ID (default: 0)',
          example: 0,
        },
        duration: {
          type: 'number',
          description: 'Duration in milliseconds (default: 1000)',
          example: 1000,
        },
      },
      required: ['token', 'deviceId', 'operation'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'PTZ control executed successfully',
  })
  async controlPtz(
    @Body('token') userToken: string,
    @Body('deviceId') deviceId: string,
    @Body('operation') operation: string,
    @Body('channelId') channelId?: number,
    @Body('duration') duration?: number,
  ) {
    const result = await this.deviceService.controlPtz(
      userToken,
      deviceId,
      operation,
      channelId || 0,
      duration || 1000,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('device-online')
  @ApiOperation({
    summary: 'Get device online status',
    description:
      'Query the online status of a device and its channels. Status codes: 0=offline, 1=online, 3=upgrading, 4=sleeping',
  })
  @ApiQuery({
    name: 'token',
    required: true,
    type: String,
    description: 'User access token (admin or sub-account)',
  })
  @ApiQuery({
    name: 'deviceId',
    required: true,
    type: String,
    description: 'Device serial number',
    example: 'TESTQWERXXXX',
  })
  @ApiResponse({
    status: 200,
    description: 'Device online status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            deviceId: { type: 'string', example: 'TESTQWERXXXX' },
            onLine: {
              type: 'string',
              example: '1',
              description: '0=offline, 1=online, 3=upgrading, 4=sleeping',
            },
            channels: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  channelId: { type: 'string', example: '0' },
                  onLine: { type: 'string', example: '1' },
                },
              },
            },
          },
        },
      },
    },
  })
  async getDeviceOnline(
    @Query('token') userToken: string,
    @Query('deviceId') deviceId: string,
  ) {
    const result = await this.deviceService.getDeviceOnlineStatus(
      userToken,
      deviceId,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('device-binding-status')
  @ApiOperation({
    summary: 'Check device binding status',
    description:
      'Query whether a device is bound to any account, and whether it is bound to the current account',
  })
  @ApiQuery({
    name: 'token',
    required: true,
    type: String,
    description: 'User access token (admin or sub-account)',
  })
  @ApiQuery({
    name: 'deviceId',
    required: true,
    type: String,
    description: 'Device serial number',
    example: 'TESTQWERXXXX',
  })
  @ApiResponse({
    status: 200,
    description: 'Device binding status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            isBind: {
              type: 'boolean',
              example: true,
              description: 'true if device is bound to some account',
            },
            isMine: {
              type: 'boolean',
              example: true,
              description: 'true if device is bound to current account',
            },
          },
        },
      },
    },
  })
  async checkDeviceBinding(
    @Query('token') userToken: string,
    @Query('deviceId') deviceId: string,
  ) {
    const result = await this.deviceService.checkDeviceBindingStatus(
      userToken,
      deviceId,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('device/unbind')
  @ApiOperation({
    summary: 'Unbind (remove) a device from account',
    description:
      'Unbind a device from the current account. After unbinding: alarm messages are deleted immediately, cloud video will expire (not deleted immediately), and active cloud storage package returns to developer account for reuse. Rate limit: 2,000 calls/day.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'User access token (admin or sub-account)',
        },
        deviceId: {
          type: 'string',
          description: 'Device serial number',
          example: 'TESTQWERXXXX',
        },
      },
      required: ['token', 'deviceId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Device unbound successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Device unbound successfully' },
        data: {
          type: 'object',
          properties: {
            msg: {
              type: 'string',
              example: 'The operation was successful.',
            },
            code: { type: 'string', example: '0' },
          },
        },
      },
    },
  })
  async unbindDevice(
    @Body('token') userToken: string,
    @Body('deviceId') deviceId: string,
  ) {
    const result = await this.deviceService.unbindDevice(userToken, deviceId);
    return {
      success: true,
      message: 'Device unbound successfully',
      data: result,
    };
  }

  @Post('device/bind')
  @ApiOperation({
    summary: 'Bind a device to an account',
    description:
      'Bind a device to the current account using its verification code or password. Either code or encryptCode must be provided. Use encryptCode for better security. Some newer devices may require initialization through OpenSDK. Rate limit: 2,000 calls/day.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'Administrator access token',
        },
        deviceId: {
          type: 'string',
          description: 'Device serial number',
          example: 'TESTQWERXXXX',
        },
        code: {
          type: 'string',
          description:
            'Device verification code: auth password, 6-digit security code from device label, or empty string',
          example: 'Admin123',
        },
        encryptCode: {
          type: 'string',
          description:
            'Optional encrypted version of code (AES-256-CBC) for better security',
          example: '5ZtW6b0Ttf1zOiFhqynKaA==',
        },
      },
      required: ['token', 'deviceId', 'code'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Device bound successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Device bound successfully' },
        data: {
          type: 'object',
          properties: {
            msg: {
              type: 'string',
              example: 'The operation was successful.',
            },
            code: { type: 'string', example: '0' },
          },
        },
      },
    },
  })
  async bindDevice(
    @Body('token') userToken: string,
    @Body('deviceId') deviceId: string,
    @Body('code') code: string,
    @Body('encryptCode') encryptCode?: string,
  ) {
    const result = await this.deviceService.bindDevice(
      userToken,
      deviceId,
      code,
      encryptCode,
    );
    return {
      success: true,
      message: 'Device bound successfully',
      data: result,
    };
  }
}
