import { Injectable } from '@nestjs/common';
import { UpdateCategoryPayload } from './update-category.command';

@Injectable()
export class UpdateCategoryValidator {
  validate(id: string, payload: UpdateCategoryPayload): void {
    if (!id) {
      throw new Error('Category ID is required');
    }
    if (payload.name !== undefined && payload.name.trim().length === 0) {
      throw new Error('Category name cannot be empty');
    }
  }
}