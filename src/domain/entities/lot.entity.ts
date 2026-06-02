import { BusinessRuleException } from '../exceptions';

export class Lot {
  id!: string;
  productId!: string;
  lotCode!: string;
  quantityReceived!: number;
  quantityAvailable!: number;
  unitCost!: number;
  estimatedUnitProfit!: number;
  receivedAt!: Date;
  expiresAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date;

  constructor(partial: Partial<Lot>) {
    Object.assign(this, partial);
    this.validate();
  }

  validate(): void {
    if (!this.productId) {
      throw new BusinessRuleException('Product is required for lot');
    }
    if (!this.lotCode?.trim()) {
      throw new BusinessRuleException('Lot code is required');
    }
    if (!Number.isFinite(this.quantityReceived) || this.quantityReceived <= 0) {
      throw new BusinessRuleException('Lot received quantity must be greater than 0');
    }
    if (!Number.isFinite(this.quantityAvailable) || this.quantityAvailable < 0) {
      throw new BusinessRuleException('Lot available quantity cannot be negative');
    }
    if (!Number.isFinite(this.unitCost) || this.unitCost <= 0) {
      throw new BusinessRuleException('Lot unit cost must be greater than 0');
    }
    if (!this.receivedAt || Number.isNaN(this.receivedAt.getTime())) {
      throw new BusinessRuleException('Lot received date is invalid');
    }
    if (this.receivedAt.getTime() > Date.now()) {
      throw new BusinessRuleException('Lot received date cannot be in the future');
    }
    if (this.expiresAt && Number.isNaN(this.expiresAt.getTime())) {
      throw new BusinessRuleException('Lot expiration date is invalid');
    }
  }

  get isDeleted(): boolean {
    return Boolean(this.deletedAt);
  }
}
