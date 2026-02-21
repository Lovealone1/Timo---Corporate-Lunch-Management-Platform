import { ApiProperty } from '@nestjs/swagger';

class ProteinCountDto {
    @ApiProperty({ example: 'uuid' })
    proteinTypeId!: string;

    @ApiProperty({ example: 'Pollo' })
    proteinName!: string;

    @ApiProperty({ example: 10 })
    count!: number;
}

export class ReservationSummaryDto {
    @ApiProperty({ example: '2026-03-01' })
    date!: string;

    @ApiProperty({ example: 'RESERVADA', description: 'Global status of reservations for this date' })
    status!: string;

    @ApiProperty({ type: [ProteinCountDto] })
    proteins!: ProteinCountDto[];
}
