import { BusinessRuleException } from '../exceptions';

export class Category {
  readonly id!: string;
  readonly name!: string;
  readonly description?: string;
  readonly taxRateId!: string;
  readonly createdAt!: Date;
  deletedAt?: Date;

  private _isActive!: boolean;
  private _updatedAt!: Date;

  constructor(properties: {
    id: string;
    name: string;
    description?: string;
    taxRateId: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
  }) {
    this.id = properties.id;
    this.name = properties.name;
    this.description = properties.description;
    this.taxRateId = properties.taxRateId;
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
      throw new BusinessRuleException('Category is already active');
    }
    this._isActive = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    if (!this._isActive) {
      throw new BusinessRuleException('Category is already inactive');
    }
    this._isActive = false;
    this._updatedAt = new Date();
  }
}
