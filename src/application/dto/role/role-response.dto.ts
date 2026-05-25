import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../domain/entities/role.entity';

export class RoleResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'ADMIN' })
  name!: string;

  @ApiProperty({ example: 'Administrador del sistema' })
  description?: string;

  @ApiProperty()
  createdAt!: Date;

  static fromEntity(role: Role): RoleResponseDto {
    const dto = new RoleResponseDto();
    dto.id = role.id;
    dto.name = role.name;
    dto.description = role.description;
    dto.createdAt = role.createdAt;
    return dto;
  }

  static fromEntities(roles: Role[]): RoleResponseDto[] {
    return roles.map((r) => RoleResponseDto.fromEntity(r));
  }
}