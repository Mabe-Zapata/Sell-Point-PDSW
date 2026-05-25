import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetTaxRateQuery } from '../../../../../application/cqrs/tax-rate/queries/get-tax-rate/get-tax-rate.query';
import { GetTaxRateHandler as ApplicationGetTaxRateHandler } from '../../../../../application/cqrs/tax-rate/queries/get-tax-rate/get-tax-rate.handler';
import { TaxRateRepository } from '../../../../repositories/tax-rate.repository';
import { TAX_RATE_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(GetTaxRateQuery)
export class GetTaxRateHandler implements IQueryHandler<GetTaxRateQuery> {
  private readonly appHandler: ApplicationGetTaxRateHandler;

  constructor(
    @Inject(TAX_RATE_REPOSITORY) taxRateRepository: TaxRateRepository,
  ) {
    this.appHandler = new ApplicationGetTaxRateHandler(taxRateRepository);
  }

  async execute(query: GetTaxRateQuery) {
    return this.appHandler.execute(query);
  }
}
