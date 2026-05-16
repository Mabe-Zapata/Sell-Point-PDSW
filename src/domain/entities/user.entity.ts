export class User {
  id: string;

  employeeId: string;

  email?: string;

  passwordHash: string;

  role: string;

  isActive: boolean;

  createdAt: Date;

  updatedAt: Date;

  deletedAt?: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
