import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateReservationDto {
    @ApiProperty({
        example: '1234567890',
        description: 'User document (CC) to verify ownership',
    })
    @IsNotEmpty()
    @IsString()
    cc!: string;

    @ApiProperty({
        example: 'uuid',
        description: 'New ProteinType UUID',
    })
    @IsUUID()
    proteinTypeId!: string;

    @ApiPropertyOptional({
        example: ['uuid-1', 'uuid-2'],
        description: 'New set of SideDish UUIDs (replaces existing)',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    sideDishIds?: string[];
}
