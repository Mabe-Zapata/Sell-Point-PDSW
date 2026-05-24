import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../domain/entities';

export class AuthMeResponseDto {
  @ApiProperty({ example: 'ff9f4735-6723-4e7a-828b-f2f9fec1b0b3' })
  id: string;

  @ApiProperty({ example: 'ADMIN-001' })
  employeeId: string;

  @ApiProperty({ example: 'admin' })
  username: string;

  @ApiProperty({ example: 'admin@billflow.com' })
  email: string;

  @ApiProperty({ example: 'ADMIN', required: false, nullable: true })
  role?: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-05-24T01:31:18.045Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-05-24T01:31:18.045Z' })
  updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.employeeId = user.employeeId;
    this.username = user.username;
    this.email = user.email;
    this.role = user.role;
    this.status = user.status;
    this.isActive = user.isActive;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  static fromEntity(user: User): AuthMeResponseDto {
    return new AuthMeResponseDto(user);
  }
}
