export class Category {
  readonly id!: string;
  readonly name!: string;
  readonly description?: string;
  readonly createdAt!: Date;

  private _isActive!: boolean;
  private _updatedAt!: Date;

  constructor(properties: {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = properties.id;
    this.name = properties.name;
    this.description = properties.description;
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
      throw new Error('Category is already active');
    }
    this._isActive = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    if (!this._isActive) {
      throw new Error('Category is already inactive');
    }
    this._isActive = false;
    this._updatedAt = new Date();
  }
}