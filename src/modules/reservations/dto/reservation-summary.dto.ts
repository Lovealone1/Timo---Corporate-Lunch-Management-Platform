import { ApiProperty } from '@nestjs/swagger';

export class ReservationSummaryDto {
    @ApiProperty({ example: 'uuid' })
    proteinTypeId!: string;

    @ApiProperty({ example: 'Pollo' })
    proteinName!: string;

    @ApiProperty({ example: 10 })
    count!: number;
}
