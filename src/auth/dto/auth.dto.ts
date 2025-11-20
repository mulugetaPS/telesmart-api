import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';
import { EthiopianPhone } from 'src/common/decorators/phone.decorator';

export class SendOtpDto {
  @ApiProperty({
    description: 'Ethiopian phone number',
    example: '+251912345678',
  })
  @EthiopianPhone()
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ description: 'Phone number' })
  @EthiopianPhone()
  phone: string;

  @ApiProperty({
    description: 'OTP code received via SMS',
    example: '123456',
    minLength: 4,
    maxLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 8, { message: 'OTP must be between 4 and 8 characters' })
  code: string;
}

export class SendOtpResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'OTP sent successfully',
  })
  message: string;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'User phone number',
    example: '+251912345678',
  })
  phone: string;

  @ApiProperty({
    description: 'User active status',
    example: true,
  })
  isActive: boolean;
}

export class VerifyOtpResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

export class RefreshTokenResponseDto {
  @ApiProperty({
    description: 'New JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;
}
