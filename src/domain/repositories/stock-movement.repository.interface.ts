import { StockMovement } from '../entities';
import { PaginationParams, PaginatedResult } from './pagination.types';

export interface StockMovementFilters {
  warehouseId?: string;
  productId?: string;
  type?: string;
  userId?: string;
  referenceType?: string;
  referenceId?: string;
}

export interface IStockMovementRepository {
  findById(id: string): Promise<StockMovement | null>;
  findAll(
    pagination?: PaginationParams,
    filters?: StockMovementFilters,
  ): Promise<PaginatedResult<StockMovement>>;
  create(stockMovement: StockMovement): Promise<StockMovement>;
}
