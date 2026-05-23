import { Injectable } from '@nestjs/common';

@Injectable()
export class RemoveSaleDetailValidator {
  validate(saleId: string, saleDetailId: string): void {
    if (!saleId) {
      throw new Error('Sale ID is required');
    }
    if (!saleDetailId) {
      throw new Error('Sale detail ID is required');
    }
  }
}