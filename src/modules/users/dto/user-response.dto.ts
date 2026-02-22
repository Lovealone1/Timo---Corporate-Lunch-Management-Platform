import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
    @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
    id!: string;

    @ApiProperty({ example: 'user@example.com' })
    email!: string;

    @ApiPropertyOptional({ example: '1234567890' })
    document?: string | null;

    @ApiProperty({ enum: ['USER', 'ADMIN'], example: 'USER' })
    role!: string;

    @ApiProperty({ example: true })
    enabled!: boolean;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;
}
