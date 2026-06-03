import { User } from '../../../domain/entities/user.entity';

export class UserResponseDto {
  id!: string;
  employeeId!: string;
  username!: string;
  email!: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  cedula?: string;
  status!: string;
  isActive!: boolean;
  createdAt!: Date;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.employeeId = user.employeeId;
    dto.username = user.username;
    dto.email = user.email;
    dto.role = user.role;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.cedula = user.cedula;
    dto.status = user.status;
    dto.isActive = user.isActive;
    dto.createdAt = user.createdAt;
    return dto;
  }

  static fromEntities(users: User[]): UserResponseDto[] {
    return users.map((u) => UserResponseDto.fromEntity(u));
  }
}
