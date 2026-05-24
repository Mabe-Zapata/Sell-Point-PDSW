import { BusinessRuleException } from '../exceptions';

export class TaxRate {
  readonly id!: string;
  readonly name!: string;
  readonly percentage!: number;
  readonly createdAt!: Date;

  private _isActive!: boolean;
  private _updatedAt!: Date;

  constructor(properties: {
    id: string;
    name: string;
    percentage: number;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = properties.id;
    this.name = properties.name;
    this.percentage = properties.percentage;
    this._isActive = properties.isActive;
    this.createdAt = properties.createdAt || new Date();
    this._updatedAt = properties.updatedAt || new Date();
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  activate(): void {
    if (this._isActive) {
      throw new BusinessRuleException('TaxRate is already active');
    }
    this._isActive = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    if (!this._isActive) {
      throw new BusinessRuleException('TaxRate is already inactive');
    }
    this._isActive = false;
    this._updatedAt = new Date();
  }
}
