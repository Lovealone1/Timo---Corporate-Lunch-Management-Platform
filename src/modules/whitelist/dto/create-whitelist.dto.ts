import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWhitelistDto {
  @ApiProperty({
    example: '1234567890',
    description: 'Cédula (identification number)',
    minLength: 2,
    maxLength: 20,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  cc!: string;

  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Full name',
    minLength: 2,
    maxLength: 120,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;
}
