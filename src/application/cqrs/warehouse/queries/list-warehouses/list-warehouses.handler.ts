import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListWarehousesQuery } from './list-warehouses.query';
import { ListWarehousesValidator } from './list-warehouses.validator';
import { WAREHOUSE_REPOSITORY } from '../../../../tokens';
import type { IWarehouseRepository } from '../../../../../domain/repositories';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { Warehouse } from '../../../../../domain/entities';

@QueryHandler(ListWarehousesQuery)
export class ListWarehousesHandler implements IQueryHandler<ListWarehousesQuery> {
  constructor(
    private readonly validator: ListWarehousesValidator,
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouseRepository: IWarehouseRepository,
  ) {}

  async execute(query: ListWarehousesQuery): Promise<PaginatedResult<Warehouse>> {
    const validPagination = this.validator.validate(query.pagination);
    return this.warehouseRepository.findAll(validPagination, {
      q: query.q,
      branchId: query.branchId,
      isActive: query.isActive,
      isMain: query.isMain,
    });
  }
}