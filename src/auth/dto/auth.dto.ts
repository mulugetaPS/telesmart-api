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
  id: string;

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

  @ApiProperty({
    description: 'Imou OpenID',
    example: null,
    nullable: true,
  })
  openid: string | null;

  @ApiProperty({
    description: 'Last login timestamp',
    example: '2024-11-13T10:30:00.000Z',
    nullable: true,
  })
  lastLoginAt: Date | null;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-11-01T08:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-11-13T10:30:00.000Z',
  })
  updatedAt: Date;
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
