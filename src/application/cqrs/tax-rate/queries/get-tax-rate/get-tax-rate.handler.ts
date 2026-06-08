import { GetTaxRateQuery } from './get-tax-rate.query';
import type { ITaxRateRepository } from '../../../../../domain/repositories';
import { TaxRate } from '../../../../../domain/entities';

export class GetTaxRateHandler {
  constructor(
    protected readonly taxRateRepository: ITaxRateRepository,
  ) {}

  async execute(query: GetTaxRateQuery): Promise<TaxRate | null> {
    return this.taxRateRepository.findById(query.id);
  }
}
