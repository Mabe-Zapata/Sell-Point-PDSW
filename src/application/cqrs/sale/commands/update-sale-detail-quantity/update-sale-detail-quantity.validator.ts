import { Injectable } from '@nestjs/common';
import type { UpdateSaleDetailQuantityPayload } from './update-sale-detail-quantity.command';

@Injectable()
export class UpdateSaleDetailQuantityValidator {
  validate(payload: UpdateSaleDetailQuantityPayload): void {
    if (!payload.saleId) {
      throw new Error('Sale ID is required');
    }
    if (!payload.saleDetailId) {
      throw new Error('Sale Detail ID is required');
    }
    if (payload.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
  }
}