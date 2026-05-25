import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListTaxRatesQuery } from '../../../../../application/cqrs/tax-rate/queries/list-tax-rates/list-tax-rates.query';
import { ListTaxRatesHandler as ApplicationListTaxRatesHandler } from '../../../../../application/cqrs/tax-rate/queries/list-tax-rates/list-tax-rates.handler';
import { TaxRateRepository } from '../../../../repositories/tax-rate.repository';
import { TAX_RATE_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(ListTaxRatesQuery)
export class ListTaxRatesHandler implements IQueryHandler<ListTaxRatesQuery> {
  private readonly appHandler: ApplicationListTaxRatesHandler;

  constructor(
    @Inject(TAX_RATE_REPOSITORY) taxRateRepository: TaxRateRepository,
  ) {
    this.appHandler = new ApplicationListTaxRatesHandler(taxRateRepository);
  }

  async execute(query: ListTaxRatesQuery) {
    return this.appHandler.execute(query);
  }
}
