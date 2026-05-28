import { User } from '../../../domain/entities';

export class UserListResponseDto {
  id: string;
  employeeId: string;
  username: string;
  email: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  cedula?: string;
  status: string;
  isActive: boolean;
  failedLoginAttempts: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.employeeId = user.employeeId;
    this.username = user.username;
    this.email = user.email;
    this.role = user.role;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.cedula = user.cedula;
    this.status = user.status;
    this.isActive = user.isActive;
    this.failedLoginAttempts = user.failedLoginAttempts;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  static fromEntity(user: User): UserListResponseDto {
    return new UserListResponseDto(user);
  }

  static fromEntities(users: User[]): UserListResponseDto[] {
    return users.map((user) => new UserListResponseDto(user));
  }
}

