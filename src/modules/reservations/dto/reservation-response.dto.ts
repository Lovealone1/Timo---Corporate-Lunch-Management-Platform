import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SideDishSnapshotDto {
    @ApiProperty({ example: 'uuid' })
    id!: string;

    @ApiPropertyOptional({ example: 'uuid' })
    sideDishId!: string | null;

    @ApiProperty({ example: 'Ensalada' })
    nameSnapshot!: string;
}

export class ReservationResponseDto {
    @ApiProperty({ example: 'uuid' })
    id!: string;

    @ApiProperty({ example: 'uuid' })
    menuId!: string;

    @ApiPropertyOptional({ example: 'uuid' })
    whitelistEntryId!: string | null;

    @ApiProperty({ example: '1234567890' })
    cc!: string;

    @ApiProperty({ example: 'Juan Pérez' })
    name!: string;

    @ApiProperty({ example: 'uuid' })
    proteinTypeId!: string;

    @ApiProperty()
    proteinType!: { id: string; name: string };

    @ApiProperty({ example: 'RESERVADA' })
    status!: string;

    @ApiPropertyOptional({ example: '2026-03-01T12:00:00.000Z' })
    servedAt!: Date | null;

    @ApiProperty({ type: [SideDishSnapshotDto] })
    sideDishes!: SideDishSnapshotDto[];

    @ApiProperty()
    menu!: { id: string; date: Date; dayOfWeek: string | null };

    @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
    createdAt!: Date;

    @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
    updatedAt!: Date;
}
