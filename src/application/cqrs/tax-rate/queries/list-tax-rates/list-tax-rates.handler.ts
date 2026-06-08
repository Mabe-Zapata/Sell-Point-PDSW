import { ListTaxRatesQuery } from './list-tax-rates.query';
import { TAX_RATE_REPOSITORY } from '../../../../tokens';
import type { ITaxRateRepository } from '../../../../../domain/repositories';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { TaxRate } from '../../../../../domain/entities';export class ListTaxRatesHandler {
  constructor(
    protected readonly taxRateRepository: ITaxRateRepository,
  ) {}

  async execute(query: ListTaxRatesQuery): Promise<PaginatedResult<TaxRate>> {
    return this.taxRateRepository.findAll(query.pagination, { q: query.q, isActive: query.isActive });
  }
}
