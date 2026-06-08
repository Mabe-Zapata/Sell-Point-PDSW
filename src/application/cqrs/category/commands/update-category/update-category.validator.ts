import { UpdateCategoryPayload } from './update-category.command';export class UpdateCategoryValidator {
  static validate(id: string, payload: UpdateCategoryPayload): void {
    if (!id) {
      throw new Error('Category ID is required');
    }
    if (payload.name !== undefined && payload.name.trim().length === 0) {
      throw new Error('Category name cannot be empty');
    }
  }
}