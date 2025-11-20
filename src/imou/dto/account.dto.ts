import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubAccountDto {
  @ApiProperty({
    description: 'Phone number or email address',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  account: string;
}

export class DeleteSubAccountDto {
  @ApiProperty({
    description: 'Sub-account openid to delete',
    example: '5dd2fe5bc11240a9b5d4fd4474c857c5',
  })
  @IsString()
  @IsNotEmpty()
  openid: string;
}

export class GetSubAccountTokenDto {
  @ApiProperty({
    description: 'Sub-account openid',
    example: '5dd2fe5bc11240a9b5d4fd4474c857c5',
  })
  @IsString()
  @IsNotEmpty()
  openid: string;
}

export class ListSubAccountsDto {
  @ApiProperty({
    description: 'Page number (starts at 1)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNo?: number;

  @ApiProperty({
    description: 'Page size (default: 5, max: 10)',
    example: 5,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  pageSize?: number;
}
