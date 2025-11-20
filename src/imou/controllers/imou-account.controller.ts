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
import { ImouAdminService } from '../services/imou-admin.service';
import { ImouSubAccountService } from '../services/imou-sub-account.service';
import {
  CreateSubAccountDto,
  DeleteSubAccountDto,
  GetSubAccountTokenDto,
  ListSubAccountsDto,
} from '../dto/account.dto';

@ApiTags('IMOU - Account Management')
@Controller('imou/account')
export class ImouAccountController {
  constructor(
    private readonly adminService: ImouAdminService,
    private readonly subAccountService: ImouSubAccountService,
  ) {}

  @Get('admin/token')
  @ApiOperation({
    summary: 'Get admin access token',
    description: 'Retrieve the administrator access token for API calls',
  })
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
  @ApiOperation({
    summary: 'Create sub-account',
    description: 'Create a new sub-account with phone number or email',
  })
  @ApiResponse({
    status: 201,
    description: 'Sub-account created successfully',
  })
  async createSubAccount(@Body() dto: CreateSubAccountDto) {
    const result = await this.subAccountService.createSubAccount(dto.account);
    return {
      success: true,
      data: result,
    };
  }

  @Get('sub-accounts')
  @ApiOperation({
    summary: 'List sub-accounts',
    description: 'Get paginated list of all sub-accounts',
  })
  @ApiResponse({
    status: 200,
    description: 'Sub-accounts list retrieved successfully',
  })
  async listSubAccounts(@Query() dto: ListSubAccountsDto) {
    const result = await this.subAccountService.listSubAccounts(
      dto.pageNo || 1,
      dto.pageSize || 5,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('sub-account/token')
  @ApiOperation({
    summary: 'Get sub-account access token',
    description: 'Retrieve access token for a specific sub-account',
  })
  @ApiResponse({
    status: 200,
    description: 'Sub-account token retrieved successfully',
  })
  async getSubAccountToken(@Query() dto: GetSubAccountTokenDto) {
    const result = await this.subAccountService.getSubAccountToken(dto.openid);
    return {
      success: true,
      data: result,
    };
  }

  @Post('sub-account/delete')
  @ApiOperation({
    summary: 'Delete sub-account',
    description:
      'Delete a sub-account and all its permissions. This operation is irreversible.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sub-account deleted successfully',
  })
  async deleteSubAccount(@Body() dto: DeleteSubAccountDto) {
    await this.subAccountService.deleteSubAccount(dto.openid);
    return {
      success: true,
      message: 'Sub-account deleted successfully',
    };
  }
}
