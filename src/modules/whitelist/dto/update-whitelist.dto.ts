import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateWhitelistDto {
  @ApiPropertyOptional({
    example: '1234567890',
    description: 'Cédula (identification number)',
    minLength: 2,
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  cc?: string;

  @ApiPropertyOptional({
    example: 'Juan Pérez',
    description: 'Full name',
    minLength: 2,
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;
}
