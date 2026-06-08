import { GetStockLevelsQuery } from './get-stock-levels.query';
import { PRODUCT_REPOSITORY } from '../../../../tokens';
import type { IProductRepository } from '../../../../../domain/repositories';

interface StockLevelResult {
  productId: string;
  currentStock: number;
}export class GetStockLevelsHandler {
  constructor(
    protected readonly productRepository: IProductRepository,
  ) {}

  async execute(query: GetStockLevelsQuery): Promise<StockLevelResult[]> {
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
