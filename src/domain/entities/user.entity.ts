import { UserStatus } from './enums';

export class User {
  id!: string;

  employeeId!: string;

  email?: string;

  passwordHash!: string;

  role!: string;

  status!: UserStatus;

  defaultBranchId?: string;

  failedLoginAttempts!: number;

  createdAt!: Date;

  updatedAt!: Date;

  deletedAt?: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
