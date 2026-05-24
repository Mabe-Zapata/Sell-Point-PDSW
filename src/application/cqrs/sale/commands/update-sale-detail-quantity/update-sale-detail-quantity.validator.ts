import { Injectable } from '@nestjs/common';
import { UpdateSaleDetailQuantityPayload } from './update-sale-detail-quantity.command';

@Injectable()
export class UpdateSaleDetailQuantityValidator {
  validate(saleId: string, payload: UpdateSaleDetailQuantityPayload): void {
    if (!saleId) {
      throw new Error('Sale ID is required');
    }
    if (!payload.saleDetailId) {
      throw new Error('Sale detail ID is required');
    }
    if (payload.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
  }
}