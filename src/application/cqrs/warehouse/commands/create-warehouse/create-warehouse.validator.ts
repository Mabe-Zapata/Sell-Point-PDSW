import { Injectable } from '@nestjs/common';
import { CreateWarehousePayload } from './create-warehouse.command';

@Injectable()
export class CreateWarehouseValidator {
  validate(payload: CreateWarehousePayload): void {
    if (!payload.branchId) {
      throw new Error('Branch ID is required');
    }
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error('Warehouse name is required');
    }
  }
}