export class Product {
  readonly id!: string;
  readonly categoryId!: string;
  readonly code!: string;
  readonly name!: string;
  readonly description?: string;
  readonly salePrice!: number;
  readonly costPrice!: number;
  readonly currentStock!: number;
  readonly createdAt!: Date;
  readonly deletedAt?: Date;

  private _isActive!: boolean;
  private _updatedAt!: Date;

  constructor(properties: {
    id: string;
    categoryId: string;
    code: string;
    name: string;
    description?: string;
    salePrice: number;
    costPrice: number;
    currentStock: number;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
  }) {
    this.id = properties.id;
    this.categoryId = properties.categoryId;
    this.code = properties.code;
    this.name = properties.name;
    this.description = properties.description;
    this.salePrice = properties.salePrice;
    this.costPrice = properties.costPrice;
    this.currentStock = properties.currentStock;
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
      throw new Error('Product is already active');
    }
    this._isActive = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    if (!this._isActive) {
      throw new Error('Product is already inactive');
    }
    this._isActive = false;
    this._updatedAt = new Date();
  }
}