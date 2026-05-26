import { CreateTaxRatePayload } from './create-tax-rate.command';export class CreateTaxRateValidator {
  static validate(payload: CreateTaxRatePayload): void {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error('Tax rate name is required');
    }
    if (payload.percentage < 0 || payload.percentage > 100) {
      throw new Error('Tax rate percentage must be between 0 and 100');
    }
  }
}