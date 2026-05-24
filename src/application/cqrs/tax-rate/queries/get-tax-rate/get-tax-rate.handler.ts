import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetTaxRateQuery } from './get-tax-rate.query';
import { GetTaxRateValidator } from './get-tax-rate.validator';
import { TAX_RATE_REPOSITORY } from '../../../../tokens';
import type { ITaxRateRepository } from '../../../../../domain/repositories';
import { TaxRate } from '../../../../../domain/entities';

@QueryHandler(GetTaxRateQuery)
export class GetTaxRateHandler implements IQueryHandler<GetTaxRateQuery> {
  constructor(
    private readonly validator: GetTaxRateValidator,
    @Inject(TAX_RATE_REPOSITORY) private readonly taxRateRepository: ITaxRateRepository,
  ) {}

  async execute(query: GetTaxRateQuery): Promise<TaxRate | null> {
    this.validator.validate(query.id);
    return this.taxRateRepository.findById(query.id);
  }
}