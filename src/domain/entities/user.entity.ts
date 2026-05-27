import { UserStatus } from './enums';
import { BusinessRuleException } from '../exceptions';

export class User {
  readonly id!: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly cedula?: string;
  readonly role?: string;
  readonly employeeId!: string;
  readonly username!: string;
  readonly email!: string;
  readonly passwordHash!: string;
  readonly currentPasswordHash?: string;
  readonly defaultBranchId?: string;
  readonly googleId?: string;
  readonly passwordExpired!: boolean;
  readonly failedLoginAttempts!: number;
  readonly createdAt!: Date;
  readonly deletedAt?: Date;

  private _status!: UserStatus;
  private _updatedAt!: Date;

  constructor(properties: {
    id: string;
    firstName?: string;
    lastName?: string;
    cedula?: string;
    role?: string;
    employeeId: string;
    username: string;
    email: string;
    passwordHash: string;
    currentPasswordHash?: string;
    defaultBranchId?: string;
    googleId?: string;
    failedLoginAttempts?: number;
    passwordExpired?: boolean;
    status: UserStatus;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
  }) {
    this.id = properties.id;
    this.firstName = properties.firstName;
    this.lastName = properties.lastName;
    this.cedula = properties.cedula;
    this.role = properties.role;
    this.employeeId = properties.employeeId;
    this.username = properties.username;
    this.email = properties.email;
    this.passwordHash = properties.passwordHash;
    this.currentPasswordHash = properties.currentPasswordHash;
    this.defaultBranchId = properties.defaultBranchId;
    this.googleId = properties.googleId;
    this.passwordExpired = properties.passwordExpired ?? true;
    this.failedLoginAttempts = properties.failedLoginAttempts ?? 0;
    this._status = properties.status;
    this.createdAt = properties.createdAt || new Date();
    this._updatedAt = properties.updatedAt || new Date();
    this.deletedAt = properties.deletedAt;
  }

  get status(): UserStatus {
    return this._status;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get isActive(): boolean {
    return this._status === UserStatus.ACTIVE;
  }

  activate(): void {
    if (this._status === UserStatus.ACTIVE) {
      throw new BusinessRuleException('User is already active');
    }
    this._status = UserStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    if (this._status === UserStatus.INACTIVE) {
      throw new BusinessRuleException('User is already inactive');
    }
    this._status = UserStatus.INACTIVE;
    this._updatedAt = new Date();
  }

  block(): void {
    if (this._status === UserStatus.BLOCKED) {
      throw new BusinessRuleException('User is already blocked');
    }
    this._status = UserStatus.BLOCKED;
    this._updatedAt = new Date();
  }

  unlock(): void {
    if (this._status !== UserStatus.BLOCKED) {
      throw new BusinessRuleException('User is not blocked');
    }
    this._status = UserStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  // Factory method — encapsulates business rules for new employee creation
  static createNewEmployee(params: {
    id: string;
    employeeId: string;
    email: string;
    passwordHash: string;
    role: string;
    firstName: string;
    lastName: string;
    cedula?: string;
    username?: string;
    defaultBranchId?: string;
  }): User {
    return new User({
      id: params.id,
      employeeId: params.employeeId,
      username: params.username || params.email,
      email: params.email,
      passwordHash: params.passwordHash,
      role: params.role,
      firstName: params.firstName,
      lastName: params.lastName,
      cedula: params.cedula,
      defaultBranchId: params.defaultBranchId,
      status: UserStatus.ACTIVE,
      failedLoginAttempts: 0,
      passwordExpired: true,
    });
  }
}
