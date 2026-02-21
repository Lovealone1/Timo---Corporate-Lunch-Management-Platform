import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateMenuDto {
    @ApiProperty({
        example: '2026-03-01',
        description: 'Date for the menu (YYYY-MM-DD)',
    })
    @IsDateString()
    date!: string;

    @ApiPropertyOptional({
        example: 'uuid',
        description: 'Soup UUID',
    })
    @IsOptional()
    @IsUUID()
    soupId?: string;

    @ApiPropertyOptional({
        example: 'uuid',
        description: 'Drink UUID',
    })
    @IsOptional()
    @IsUUID()
    drinkId?: string;

    @ApiPropertyOptional({
        example: '99dc22df-fdb4-4000-8e5e-30caab647b1d',
        description: 'Default protein type UUID (defaults to 99dc22df-fdb4-4000-8e5e-30caab647b1d)',
    })
    @IsOptional()
    @IsUUID()
    defaultProteinTypeId?: string;

    @ApiPropertyOptional({
        example: ['uuid-1', 'uuid-2'],
        description: 'Array of ProteinType UUIDs to add as options',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    proteinOptionIds?: string[];

    @ApiPropertyOptional({
        example: ['uuid-1', 'uuid-2'],
        description: 'Array of SideDish UUIDs to add as options',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    sideOptionIds?: string[];
}
