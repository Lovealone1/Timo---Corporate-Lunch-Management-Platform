import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleUserEnabledDto {
    @ApiProperty({ example: false })
    @IsBoolean()
    enabled!: boolean;
}
