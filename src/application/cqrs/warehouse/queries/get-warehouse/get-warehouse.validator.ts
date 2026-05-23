import { Injectable } from '@nestjs/common';

@Injectable()
export class GetWarehouseValidator {
  validate(id: string): void {
    if (!id) {
      throw new Error('Warehouse ID is required');
    }
  }
}