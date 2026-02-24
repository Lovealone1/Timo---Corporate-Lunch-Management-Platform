import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class WhitelistLoginDto {
    @ApiProperty({
        example: '1234567890',
        description: 'Cédula (identification number) to authenticate',
        minLength: 2,
        maxLength: 20,
    })
    @IsString()
    @MinLength(2)
    @MaxLength(20)
    cc!: string;
}
