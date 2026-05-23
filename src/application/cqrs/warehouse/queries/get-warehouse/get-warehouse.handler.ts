import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetWarehouseQuery } from './get-warehouse.query';
import { GetWarehouseValidator } from './get-warehouse.validator';
import { WAREHOUSE_REPOSITORY } from '../../../../tokens';
import type { IWarehouseRepository } from '../../../../../domain/repositories';
import { Warehouse } from '../../../../../domain/entities';

@QueryHandler(GetWarehouseQuery)
export class GetWarehouseHandler implements IQueryHandler<GetWarehouseQuery> {
  constructor(
    private readonly validator: GetWarehouseValidator,
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouseRepository: IWarehouseRepository,
  ) {}

  async execute(query: GetWarehouseQuery): Promise<Warehouse | null> {
    this.validator.validate(query.id);
    return this.warehouseRepository.findById(query.id);
  }
}