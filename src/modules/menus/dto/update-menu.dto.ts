import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class UpdateMenuDto {
    @ApiPropertyOptional({
        example: 'uuid',
        description: 'Soup UUID',
    })
    @IsOptional()
    @IsUUID()
    soupId?: string | null;

    @ApiPropertyOptional({
        example: 'uuid',
        description: 'Drink UUID',
    })
    @IsOptional()
    @IsUUID()
    drinkId?: string | null;

    @ApiPropertyOptional({
        example: '99dc22df-fdb4-4000-8e5e-30caab647b1d',
        description: 'Default protein type UUID',
    })
    @IsOptional()
    @IsUUID()
    defaultProteinTypeId?: string | null;

    @ApiPropertyOptional({
        example: ['uuid-1', 'uuid-2'],
        description: 'Replace ALL protein options with this set of ProteinType UUIDs',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    proteinOptionIds?: string[];

    @ApiPropertyOptional({
        example: ['uuid-1', 'uuid-2'],
        description: 'Replace ALL side dish options with this set of SideDish UUIDs',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    sideOptionIds?: string[];
}
