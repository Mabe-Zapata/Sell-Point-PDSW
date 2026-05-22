import { Warehouse } from '../entities';
import { PaginationParams, PaginatedResult } from './pagination.types';

export interface WarehouseFilters {
  q?: string;
  branchId?: string;
  isActive?: boolean;
  isMain?: boolean;
}

export interface IWarehouseRepository {
  findById(id: string): Promise<Warehouse | null>;
  findByBranchId(branchId: string): Promise<Warehouse[]>;
  findMainByBranchId(branchId: string): Promise<Warehouse | null>;
  findAll(
    pagination?: PaginationParams,
    filters?: WarehouseFilters,
  ): Promise<PaginatedResult<Warehouse>>;
  create(warehouse: Warehouse): Promise<Warehouse>;
  update(warehouse: Warehouse): Promise<Warehouse>;
}
