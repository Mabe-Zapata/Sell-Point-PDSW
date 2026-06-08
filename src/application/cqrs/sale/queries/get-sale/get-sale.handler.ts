import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetSaleQuery } from './get-sale.query';
import { GetSaleValidator } from './get-sale.validator';
import { SALE_REPOSITORY, SALE_DETAIL_REPOSITORY } from '../../../../tokens';
import type { ISaleRepository, ISaleDetailRepository } from '../../../../../domain/repositories';
import { Sale } from '../../../../../domain/entities';
import { SaleResponseDto } from '../../../../dto/sale/sale-response.dto';

@QueryHandler(GetSaleQuery)
export class GetSaleHandler implements IQueryHandler<GetSaleQuery> {
  constructor(
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
    @Inject(SALE_DETAIL_REPOSITORY) private readonly saleDetailRepository: ISaleDetailRepository,
  ) {}

  async execute(query: GetSaleQuery): Promise<SaleResponseDto | null> {
    GetSaleValidator.validate(query.id);
    const sale = await this.saleRepository.findById(query.id);
    if (!sale) return null;
    const details = await this.saleDetailRepository.findBySaleId(query.id);
    return SaleResponseDto.fromEntity(sale, details);
  }
}