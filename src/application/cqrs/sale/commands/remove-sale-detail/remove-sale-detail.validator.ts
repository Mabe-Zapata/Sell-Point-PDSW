export class RemoveSaleDetailValidator {
  static validate(saleId: string, saleDetailId: string): void {
    if (!saleId) {
      throw new Error('Sale ID is required');
    }
    if (!saleDetailId) {
      throw new Error('Sale detail ID is required');
    }
  }
}