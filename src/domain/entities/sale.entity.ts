import { SaleStatus } from './enums';
import { SaleDetail } from './sale-detail.entity';
import { BusinessRuleException } from '../exceptions';

export class Sale {
  id!: string;

  branchId!: string;

  customerId!: string;

  cashierUserId!: string;

  taxRateId!: string;

  saleNumber!: string;

  status!: SaleStatus;

  subtotal!: number;

  taxAmount!: number;

  discountAmount!: number;

  total!: number;

  createdAt!: Date;

  updatedAt!: Date;

  // denormalized for event emission (not persisted directly)
  customerEmail?: string;

  customerName?: string;

  details: SaleDetail[] = [];

  constructor(partial: Partial<Sale>) {
    Object.assign(this, partial);
  }

  get isConfirmable(): boolean {
    return this.status === SaleStatus.DRAFT;
  }

  get isCancellable(): boolean {
    return this.status === SaleStatus.CONFIRMED;
  }

  confirm(): void {
    if (!this.isConfirmable) {
      throw new BusinessRuleException(
        'Sale cannot be confirmed. Only DRAFT sales can be confirmed.',
      );
    }
    this.status = SaleStatus.CONFIRMED;
  }

  cancel(): void {
    if (!this.isCancellable) {
      throw new BusinessRuleException(
        'Sale cannot be cancelled. Only CONFIRMED sales can be cancelled.',
      );
    }
    this.status = SaleStatus.CANCELLED;
  }
}