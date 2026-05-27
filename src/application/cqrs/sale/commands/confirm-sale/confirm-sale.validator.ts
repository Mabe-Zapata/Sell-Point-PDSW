import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfirmSaleValidator {
  validate(saleId: string): void {
    if (!saleId) {
      throw new Error('Sale ID is required');
    }
  }
}