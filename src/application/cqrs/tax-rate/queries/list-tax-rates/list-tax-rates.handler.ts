import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListTaxRatesQuery } from './list-tax-rates.query';
import { ListTaxRatesValidator } from './list-tax-rates.validator';
import { TAX_RATE_REPOSITORY } from '../../../../tokens';
import type { ITaxRateRepository } from '../../../../../domain/repositories';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { TaxRate } from '../../../../../domain/entities';

@QueryHandler(ListTaxRatesQuery)
export class ListTaxRatesHandler implements IQueryHandler<ListTaxRatesQuery> {
  constructor(
    private readonly validator: ListTaxRatesValidator,
    @Inject(TAX_RATE_REPOSITORY) private readonly taxRateRepository: ITaxRateRepository,
  ) {}

  async execute(query: ListTaxRatesQuery): Promise<PaginatedResult<TaxRate>> {
    const validPagination = this.validator.validate(query.pagination);
    return this.taxRateRepository.findAll(validPagination, { q: query.q, isActive: query.isActive });
  }
}