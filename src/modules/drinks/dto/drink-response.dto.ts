import { ApiProperty } from '@nestjs/swagger';

export class DrinkResponseDto {
    @ApiProperty({ example: 'uuid' })
    id!: string;

    @ApiProperty({ example: 'Limonada' })
    name!: string;

    @ApiProperty({ example: true })
    isActive!: boolean;

    @ApiProperty({ example: '2026-02-20T00:00:00.000Z' })
    createdAt!: Date;

    @ApiProperty({ example: '2026-02-20T00:00:00.000Z' })
    updatedAt!: Date;
}
