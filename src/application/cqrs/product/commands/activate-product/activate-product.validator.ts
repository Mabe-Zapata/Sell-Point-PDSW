export class ActivateProductValidator {
  static validate(id: string): void {
    if (!id) {
      throw new Error('Product ID is required');
    }
  }
}