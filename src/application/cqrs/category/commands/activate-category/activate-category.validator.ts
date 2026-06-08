export class ActivateCategoryValidator {
  static validate(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new Error('Category ID is required');
    }
    return id.trim();
  }
}
