import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateReservationDto {
    @ApiProperty({
        example: '1234567890',
        description: 'User document (CC) – must be in the whitelist',
    })
    @IsNotEmpty()
    @IsString()
    cc!: string;

    @ApiProperty({
        example: 'uuid',
        description: 'Menu UUID to reserve for',
    })
    @IsUUID()
    menuId!: string;

    @ApiProperty({
        example: 'uuid',
        description: 'ProteinType UUID to reserve',
    })
    @IsUUID()
    proteinTypeId!: string;
}
