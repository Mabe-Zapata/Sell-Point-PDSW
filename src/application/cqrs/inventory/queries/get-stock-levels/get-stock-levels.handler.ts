import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetStockLevelsQuery } from './get-stock-levels.query';
import { GetStockLevelsValidator } from './get-stock-levels.validator';
import { INVENTORY_REPOSITORY } from '../../../../tokens';
import type { IInventoryRepository } from '../../../../../domain/repositories';
import { Inventory } from '../../../../../domain/entities';

@QueryHandler(GetStockLevelsQuery)
export class GetStockLevelsHandler implements IQueryHandler<GetStockLevelsQuery> {
  constructor(
    private readonly validator: GetStockLevelsValidator,
    @Inject(INVENTORY_REPOSITORY) private readonly inventoryRepository: IInventoryRepository,
  ) {}

  async execute(query: GetStockLevelsQuery): Promise<Inventory[]> {
    this.validator.validate();
    return this.inventoryRepository.findAll(undefined, {
      warehouseId: query.warehouseId,
      productId: query.productId,
    }).then(result => result.data);
  }
}