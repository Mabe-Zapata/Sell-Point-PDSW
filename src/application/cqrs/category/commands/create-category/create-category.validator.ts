import { Injectable } from '@nestjs/common';
import { CreateCategoryPayload } from './create-category.command';

@Injectable()
export class CreateCategoryValidator {
  validate(payload: CreateCategoryPayload): void {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error('Category name is required');
    }
  }
}