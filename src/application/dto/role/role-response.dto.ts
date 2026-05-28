import { Role } from '../../../domain/entities/role.entity';

export class RoleResponseDto {
  id!: string;
  name!: string;
  description?: string;
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
