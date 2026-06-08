export class GetTaxRateValidator {
  static validate(id: string): void {
    if (!id) {
      throw new Error('Tax rate ID is required');
    }
  }
}