import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GetUser } from './decorators/get-user.decorator';
import {
    SendOtpDto,
    VerifyOtpDto,
    SendOtpResponseDto,
    VerifyOtpResponseDto,
    UserResponseDto,
    RefreshTokenResponseDto,
} from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('send-otp')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Send OTP to phone number' })
    @ApiResponse({
        status: 200,
        description: 'OTP sent successfully',
        type: SendOtpResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - Invalid phone number' })
    async sendOtp(@Body() sendOtpDto: SendOtpDto) {
        return this.authService.sendOtp(sendOtpDto);
    }

    @Post('verify-otp')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify OTP and authenticate user' })
    @ApiResponse({
        status: 200,
        description: 'OTP verified successfully, returns access token and user data',
        type: VerifyOtpResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or expired OTP' })
    async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
        return this.authService.verifyOtp(verifyOtpDto);
    }

    @Get('profile')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({
        status: 200,
        description: 'User profile retrieved successfully',
        type: UserResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async getProfile(@GetUser('id') userId: number) {
        return this.authService.getProfile(userId);
    }

    @Post('refresh')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({
        status: 200,
        description: 'Token refreshed successfully',
        type: RefreshTokenResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - User not found or inactive' })
    async refreshToken(@GetUser('id') userId: number) {
        return this.authService.refreshToken(userId);
    }
}