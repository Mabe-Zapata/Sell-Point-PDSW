import { CreateCategoryPayload } from './create-category.command';export class CreateCategoryValidator {
  static validate(payload: CreateCategoryPayload): void {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error('Category name is required');
    }
  }
}