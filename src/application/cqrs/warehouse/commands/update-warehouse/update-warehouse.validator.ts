import { Injectable } from '@nestjs/common';
import { UpdateWarehousePayload } from './update-warehouse.command';

@Injectable()
export class UpdateWarehouseValidator {
  validate(id: string, payload: UpdateWarehousePayload): void {
    if (!id) {
      throw new Error('Warehouse ID is required');
    }
    if (payload.name !== undefined && payload.name.trim().length === 0) {
      throw new Error('Warehouse name cannot be empty');
    }
  }
}