import { Injectable } from '@nestjs/common';

@Injectable()
export class GetSalesHistoryValidator {
  validate(saleId: string): void {
    if (!saleId) {
      throw new Error('Sale ID is required');
    }
  }
}