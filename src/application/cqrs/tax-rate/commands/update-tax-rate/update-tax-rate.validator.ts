import { UpdateTaxRatePayload } from './update-tax-rate.command';export class UpdateTaxRateValidator {
  static validate(id: string, payload: UpdateTaxRatePayload): void {
    if (!id) {
      throw new Error('Tax rate ID is required');
    }
    if (payload.name !== undefined && payload.name.trim().length === 0) {
      throw new Error('Tax rate name cannot be empty');
    }
    if (payload.percentage !== undefined && (payload.percentage < 0 || payload.percentage > 100)) {
      throw new Error('Tax rate percentage must be between 0 and 100');
    }
  }
}