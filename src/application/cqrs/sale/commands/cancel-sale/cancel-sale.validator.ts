export class CancelSaleValidator {
  static validate(saleId: string): void {
    if (!saleId) {
      throw new Error('Sale ID is required');
    }
  }
}