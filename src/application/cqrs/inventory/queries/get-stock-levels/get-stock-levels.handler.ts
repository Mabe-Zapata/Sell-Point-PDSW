import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetStockLevelsQuery } from './get-stock-levels.query';
import { GetStockLevelsValidator } from './get-stock-levels.validator';
import { PRODUCT_REPOSITORY } from '../../../../tokens';
import type { IProductRepository } from '../../../../../domain/repositories';

interface StockLevelResult {
  productId: string;
  currentStock: number;
}

@QueryHandler(GetStockLevelsQuery)
export class GetStockLevelsHandler implements IQueryHandler<GetStockLevelsQuery> {
  constructor(
    private readonly validator: GetStockLevelsValidator,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
  ) {}

  async execute(query: GetStockLevelsQuery): Promise<StockLevelResult[]> {
    this.validator.validate();

    const filters: any = {};
    if (query.productId) {
      filters.id = query.productId;
    }

    const result = await this.productRepository.findAll({ page: 1, limit: 1000 }, filters);

    return result.data.map(product => ({
      productId: product.id,
      currentStock: product.currentStock ?? 0,
    }));
  }
}