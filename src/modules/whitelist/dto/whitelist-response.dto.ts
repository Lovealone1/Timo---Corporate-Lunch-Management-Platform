import { ApiProperty } from '@nestjs/swagger';

export class WhitelistResponseDto {
    @ApiProperty({ example: 'uuid' })
    id!: string;

    @ApiProperty({ example: '1234567890' })
    cc!: string;

    @ApiProperty({ example: 'Juan Pérez' })
    name!: string;

    @ApiProperty({ example: true })
    enabled!: boolean;

    @ApiProperty({ example: 'uuid' })
    publicToken!: string;

    @ApiProperty({ example: '2026-02-20T00:00:00.000Z' })
    createdAt!: Date;

    @ApiProperty({ example: '2026-02-20T00:00:00.000Z' })
    updatedAt!: Date;
}
