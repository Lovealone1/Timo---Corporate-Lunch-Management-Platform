import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class CloneMenuDto {
  @ApiProperty({
    example: '2026-03-15',
    description: 'Target date for the cloned menu (YYYY-MM-DD)',
  })
  @IsDateString()
  date!: string;
}
