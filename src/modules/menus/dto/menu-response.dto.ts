import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ProteinOptionDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'uuid' })
  proteinTypeId!: string;

  @ApiProperty({ example: 'Pollo' })
  proteinType!: { id: string; name: string };
}

class SideOptionDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'uuid' })
  sideDishId!: string;

  @ApiProperty({ example: 'Ensalada' })
  sideDish!: { id: string; name: string };
}

export class MenuResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  date!: Date;

  @ApiPropertyOptional({ example: 'LUN' })
  dayOfWeek!: string | null;

  @ApiPropertyOptional({ example: 'uuid' })
  soupId!: string | null;

  @ApiPropertyOptional()
  soup!: { id: string; name: string } | null;

  @ApiPropertyOptional({ example: 'uuid' })
  drinkId!: string | null;

  @ApiPropertyOptional()
  drink!: { id: string; name: string } | null;

  @ApiPropertyOptional({ example: 'uuid' })
  defaultProteinTypeId!: string | null;

  @ApiPropertyOptional()
  defaultProteinType!: { id: string; name: string } | null;

  @ApiProperty({ type: [ProteinOptionDto] })
  proteinOptions!: ProteinOptionDto[];

  @ApiProperty({ type: [SideOptionDto] })
  sideOptions!: SideOptionDto[];

  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  updatedAt!: Date;
}
