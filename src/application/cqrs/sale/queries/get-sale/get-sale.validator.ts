export class GetSaleValidator {
  static validate(id: string): void {
    if (!id) {
      throw new Error('Sale ID is required');
    }
  }
}