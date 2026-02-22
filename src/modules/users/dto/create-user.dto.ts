import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';

enum Role {
    USER = 'USER',
    ADMIN = 'ADMIN',
}

export class CreateUserDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email!: string;

    @ApiProperty({ example: 'Str0ngP@ss', minLength: 8 })
    @IsString()
    @MinLength(8)
    password!: string;

    @ApiPropertyOptional({ enum: Role, default: Role.USER })
    @IsEnum(Role)
    @IsOptional()
    role?: Role = Role.USER;

    @ApiPropertyOptional({ default: true })
    @IsBoolean()
    @IsOptional()
    enabled?: boolean = true;
}
