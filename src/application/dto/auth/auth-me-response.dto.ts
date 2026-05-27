import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../domain/entities';

export class AuthMeResponseDto {
  @ApiProperty({ example: 'ff9f4735-6723-4e7a-828b-f2f9fec1b0b3' })
  id: string;

  @ApiProperty({ example: 'John', required: false, nullable: true })
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false, nullable: true })
  lastName?: string;

  @ApiProperty({ example: 'John Doe', required: false, nullable: true })
  fullName?: string;

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

  @ApiProperty({ example: 'user@gmail.com', required: false, nullable: true })
  googleEmail?: string;

  constructor(user: User) {
    this.id = user.id;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || undefined;
    this.employeeId = user.employeeId;
    this.username = user.username;
    this.email = user.email;
    this.role = user.role;
    this.status = user.status;
    this.isActive = user.isActive;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.googleEmail = user.googleEmail;
  }

  static fromEntity(user: User): AuthMeResponseDto {
    return new AuthMeResponseDto(user);
  }
}
