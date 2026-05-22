import { StockTransfer } from '../entities';
import { PaginationParams, PaginatedResult } from './customer.repository.interface';

export interface StockTransferFilters {
  q?: string;
  fromBranchId?: string;
  toBranchId?: string;
  status?: string;
  requesterUserId?: string;
}

export interface IStockTransferRepository {
  findById(id: string): Promise<StockTransfer | null>;
  findAll(
    pagination?: PaginationParams,
    filters?: StockTransferFilters,
  ): Promise<PaginatedResult<StockTransfer>>;
  create(stockTransfer: StockTransfer): Promise<StockTransfer>;
  update(stockTransfer: StockTransfer): Promise<StockTransfer>;
}