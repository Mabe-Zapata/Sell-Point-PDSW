import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetSaleQuery } from './get-sale.query';
import { GetSaleValidator } from './get-sale.validator';
import { SALE_REPOSITORY } from '../../../../tokens';
import type { ISaleRepository } from '../../../../../domain/repositories';
import { Sale } from '../../../../../domain/entities';

@QueryHandler(GetSaleQuery)
export class GetSaleHandler implements IQueryHandler<GetSaleQuery> {
  constructor(
    private readonly validator: GetSaleValidator,
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
  ) {}

  async execute(query: GetSaleQuery): Promise<Sale | null> {
    this.validator.validate(query.id);
    return this.saleRepository.findById(query.id);
  }
}