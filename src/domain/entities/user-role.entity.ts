export class UserRole {
  userId!: string;

  roleId!: string;

  createdAt!: Date;

  constructor(partial: Partial<UserRole>) {
    Object.assign(this, partial);
  }
}
