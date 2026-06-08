export class DeactivateCustomerValidator {
  static validate(id: string): void {
    if (!id) {
      throw new Error('Customer ID is required');
    }
  }
}