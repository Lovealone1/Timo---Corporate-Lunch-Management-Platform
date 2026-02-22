import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class AuthTokenRequestDto {
  @ApiProperty({ example: 'email@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password' })
  @IsString()
  @MinLength(1)
  password!: string;
}

class SupabaseUserDto {
  @ApiProperty({ example: 'uuid-user-id' })
  id!: string;

  @ApiProperty({ example: 'email@gmail.com', required: false })
  email!: string;
}

export class AuthTokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token!: string;

  @ApiProperty({ example: 'refresh_token_value' })
  refresh_token!: string;

  @ApiProperty({ example: 3600 })
  expires_in!: number;

  @ApiProperty({ example: 'bearer' })
  token_type!: string;

  @ApiProperty({ type: SupabaseUserDto, required: false })
  user?: SupabaseUserDto;
}

export class MeResponseDto {
  @ApiProperty({ example: 'uuid-profile-id' })
  userId!: string;

  @ApiProperty({ example: 'ADMIN' })
  role!: string;

  @ApiProperty({ example: 'email@gmail.com' })
  email!: string;
}
