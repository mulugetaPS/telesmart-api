import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ExternalOtpService } from './external-otp.service';
import {
  VerifyOtpDto,
  VerifyOtpResponseDto,
  UserResponseDto,
  RefreshTokenResponseDto,
} from './dto/auth.dto';
import { ImouSubAccountService } from '../imou/services/imou-sub-account.service';

type JwtPayload = {
  sub: number;
  phone: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private externalOtpService: ExternalOtpService,
    private imouSubAccountService: ImouSubAccountService,
  ) {}

  /**
   * Send OTP to phone number using external API
   */
  sendOtp() {
    // Promise<SendOtpResponseDto>
    try {
      return {
        message: 'OTP sent successfully',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send OTP';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Verify OTP using external API and authenticate user
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<VerifyOtpResponseDto> {
    try {
      // const isValid = await this.externalOtpService.verifyOtp(
      //   verifyOtpDto.phone,
      //   verifyOtpDto.code,
      // );

      // if (!isValid) {
      //   throw new UnauthorizedException('Invalid or expired OTP');
      // }

      // Find or create user
      let user = await this.prisma.user.findUnique({
        where: { phone: verifyOtpDto.phone },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            phone: verifyOtpDto.phone,
            lastLoginAt: new Date(),
          },
        });

        // Create IMOU sub-account for new user
        try {
          const imouSubAccount =
            await this.imouSubAccountService.createSubAccount(
              verifyOtpDto.phone,
            );

          // Update user with IMOU credentials
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              openid: imouSubAccount.openid,
            },
          });

          this.logger.log(
            `IMOU sub-account created for user ${user.id}: ${imouSubAccount.openid}`,
          );
        } catch (imouError) {
          // Log error but don't fail registration
          this.logger.error(
            `Failed to create IMOU sub-account for user ${user.id}:`,
            imouError,
          );
          this.logger.warn(
            'User was created without IMOU integration. Sub-account can be created later.',
          );
        }
      } else {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
          },
        });
      }

      // Generate JWT token
      const accessToken = this.generateToken(user.id, user.phone);

      return {
        accessToken,
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'OTP verification failed';
      throw new UnauthorizedException(errorMessage);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(userId: number): Promise<RefreshTokenResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const accessToken = this.generateToken(user.id, user.phone);

    return { accessToken };
  }

  /**
   * Validate user by ID (used by JWT strategy)
   */
  async validateUser(userId: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Get user profile
   */
  async getProfile(userId: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  // ==================== Private Helper Methods ====================

  private generateToken(userId: number, phone: string): string {
    const payload: JwtPayload = {
      sub: userId,
      phone,
    };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: {
    id: number;
    phone: string;
    isActive: boolean;
  }): UserResponseDto {
    return {
      id: user.id,
      phone: user.phone,
      isActive: user.isActive,
    };
  }
}
