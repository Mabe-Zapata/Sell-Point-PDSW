import { User } from '../../../domain/entities';

export class AuthMeResponseDto {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  employeeId: string;
  username: string;
  email: string;
  role?: string;
  status: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  googleEmail?: string;
  googleId?: string;

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
    this.googleId = user.googleId;
  }

  static fromEntity(user: User): AuthMeResponseDto {
    return new AuthMeResponseDto(user);
  }
}

