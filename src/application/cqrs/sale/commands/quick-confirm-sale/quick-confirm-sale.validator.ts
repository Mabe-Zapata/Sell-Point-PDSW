import { Injectable } from '@nestjs/common';
import type { QuickConfirmSalePayload } from './quick-confirm-sale.command';

@Injectable()
export class QuickConfirmSaleValidator {
  validate(payload: QuickConfirmSalePayload): void {
    if (!payload.details || payload.details.length === 0) {
      throw new Error('At least one detail is required');
    }

    for (const detail of payload.details) {
      if (!detail.productId) {
        throw new Error('Product ID is required for each detail');
      }
      if (detail.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      if (detail.unitPrice < 0) {
        throw new Error('Unit price must be non-negative');
      }
    }
  }
}
