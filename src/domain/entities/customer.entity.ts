import { BusinessRuleException } from '../exceptions';

export class Customer {
  readonly id!: string;
  readonly firstName!: string;
  readonly lastName?: string;
  readonly cedula?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly address?: string;
  readonly createdAt!: Date;
  readonly deletedAt?: Date;

  private _isActive!: boolean;
  private _updatedAt!: Date;

  constructor(properties: {
    id: string;
    firstName: string;
    lastName?: string;
    cedula?: string;
    email?: string;
    phone?: string;
    address?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
  }) {
    this.id = properties.id;
    this.firstName = properties.firstName;
    this.lastName = properties.lastName;
    this.cedula = properties.cedula;
    this.email = properties.email;
    this.phone = properties.phone;
    this.address = properties.address;
    this._isActive = properties.isActive;
    this.createdAt = properties.createdAt || new Date();
    this._updatedAt = properties.updatedAt || new Date();
    this.deletedAt = properties.deletedAt;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  activate(): void {
    if (this._isActive) {
      throw new BusinessRuleException('Customer is already active');
    }
    this._isActive = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    if (!this._isActive) {
      throw new BusinessRuleException('Customer is already inactive');
    }
    this._isActive = false;
    this._updatedAt = new Date();
  }
}
