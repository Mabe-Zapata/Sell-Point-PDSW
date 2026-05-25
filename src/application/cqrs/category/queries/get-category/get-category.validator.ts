export class GetCategoryValidator {
  static validate(id: string): void {
    if (!id) {
      throw new Error('Category ID is required');
    }
  }
}