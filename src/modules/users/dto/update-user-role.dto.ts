import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: Role, example: Role.ADMIN })
  @IsEnum(Role)
  role!: Role;
}
