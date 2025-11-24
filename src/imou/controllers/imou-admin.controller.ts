import {
    Controller,
    Get,
    Delete,
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
import { ImouSubAccountService } from '../services/imou-sub-account.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
    ListSubAccountsDto,
    DeleteSubAccountDto,
} from '../dto/account.dto';

@ApiTags('IMOU - Admin')
@Controller('imou/admin')
export class ImouAdminController {
    constructor(private readonly subAccountService: ImouSubAccountService) { }

    @Get('sub-accounts')
    @ApiOperation({
        summary: 'List all sub-accounts',
        description: 'Get paginated list of all IMOU sub-accounts',
    })
    @ApiResponse({
        status: 200,
        description: 'Sub-accounts list retrieved successfully',
    })
    async listSubAccounts(@Query() dto: ListSubAccountsDto) {
        return await this.subAccountService.listSubAccounts(
            dto.pageNo || 1,
            dto.pageSize || 5,
        );
    }

    @Delete('sub-account')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Delete a sub-account',
        description: 'Delete a sub-account and all its permissions by openid',
    })
    @ApiResponse({
        status: 200,
        description: 'Sub-account deleted successfully',
    })
    async deleteSubAccount(@Body() dto: DeleteSubAccountDto) {
        return await this.subAccountService.deleteSubAccount(dto.openid);
    }
}
