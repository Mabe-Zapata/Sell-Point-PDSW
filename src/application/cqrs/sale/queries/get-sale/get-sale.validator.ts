import { Injectable } from '@nestjs/common';

@Injectable()
export class GetSaleValidator {
  validate(id: string): void {
    if (!id) {
      throw new Error('Sale ID is required');
    }
  }
}