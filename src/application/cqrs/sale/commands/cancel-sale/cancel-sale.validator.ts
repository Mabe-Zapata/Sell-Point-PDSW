import { Injectable } from '@nestjs/common';

@Injectable()
export class CancelSaleValidator {
  validate(saleId: string): void {
    if (!saleId) {
      throw new Error('Sale ID is required');
    }
  }
}