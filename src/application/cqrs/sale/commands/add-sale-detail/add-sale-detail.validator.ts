import { Injectable } from '@nestjs/common';
import { AddSaleDetailPayload } from './add-sale-detail.command';

@Injectable()
export class AddSaleDetailValidator {
  validate(payload: AddSaleDetailPayload): void {
    if (!payload.saleId) {
      throw new Error('Sale ID is required');
    }
    if (!payload.productId) {
      throw new Error('Product ID is required');
    }
    if (!payload.productName) {
      throw new Error('Product name is required');
    }
    if (!payload.productCode) {
      throw new Error('Product code is required');
    }
    if (payload.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    if (payload.unitPrice < 0) {
      throw new Error('Unit price cannot be negative');
    }
  }
}