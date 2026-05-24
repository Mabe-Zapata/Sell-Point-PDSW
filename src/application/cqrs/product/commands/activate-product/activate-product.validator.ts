import { Injectable } from '@nestjs/common';

@Injectable()
export class ActivateProductValidator {
  validate(id: string): void {
    if (!id) {
      throw new Error('Product ID is required');
    }
  }
}