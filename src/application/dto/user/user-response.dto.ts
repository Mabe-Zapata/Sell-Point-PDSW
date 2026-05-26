import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../domain/entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'EMP-001' })
  employeeId!: string;

  @ApiProperty({ example: 'jsmith' })
  username!: string;

  @ApiProperty({ example: 'jsmith@billflow.com' })
  email!: string;

  @ApiProperty({ example: 'ADMIN' })
  role?: string;

  @ApiProperty({ example: 'John' })
  firstName?: string;

  @ApiProperty({ example: 'Smith' })
  lastName?: string;

  @ApiProperty({ example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty()
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
    dto.status = user.status;
    dto.isActive = user.isActive;
    dto.createdAt = user.createdAt;
    return dto;
  }

  static fromEntities(users: User[]): UserResponseDto[] {
    return users.map((u) => UserResponseDto.fromEntity(u));
  }
}