import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProteinDto {
    @ApiProperty({
        example: 'Pollo',
        description: 'Name of the protein type',
        minLength: 2,
        maxLength: 80,
    })
    @IsString()
    @MinLength(2)
    @MaxLength(80)
    name!: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Indicates whether the protein is active',
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}