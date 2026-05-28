import { Injectable } from '@nestjs/common';
import type { RemoveSaleDetailPayload } from './remove-sale-detail.command';

@Injectable()
export class RemoveSaleDetailValidator {
  validate(payload: RemoveSaleDetailPayload): void {
    if (!payload.saleId) {
      throw new Error('Sale ID is required');
    }
    if (!payload.saleDetailId) {
      throw new Error('Sale Detail ID is required');
    }
  }
}