import { Injectable } from '@nestjs/common';

@Injectable()
export class GetTaxRateValidator {
  validate(id: string): void {
    if (!id) {
      throw new Error('Tax rate ID is required');
    }
  }
}