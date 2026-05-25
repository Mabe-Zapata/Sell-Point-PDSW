export class DeactivateProductValidator {
  static validate(id: string): void {
    if (!id) {
      throw new Error('Product ID is required');
    }
  }
}