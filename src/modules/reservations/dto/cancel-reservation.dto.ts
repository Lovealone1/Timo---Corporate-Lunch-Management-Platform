import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CancelReservationDto {
    @ApiProperty({
        example: '1234567890',
        description: 'User document (CC) to verify ownership',
    })
    @IsNotEmpty()
    @IsString()
    cc!: string;
}
