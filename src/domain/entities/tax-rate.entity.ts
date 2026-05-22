export class TaxRate {
  id!: string;

  name!: string;

  percentage!: number;

  isActive!: boolean;

  createdAt!: Date;

  updatedAt!: Date;

  constructor(partial: Partial<TaxRate>) {
    Object.assign(this, partial);
  }
}
