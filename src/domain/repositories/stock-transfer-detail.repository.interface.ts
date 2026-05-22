import { StockTransferDetail } from '../entities';
import { PaginationParams, PaginatedResult } from './customer.repository.interface';

export interface StockTransferDetailFilters {
  stockTransferId?: string;
  productId?: string;
}

export interface IStockTransferDetailRepository {
  findById(id: string): Promise<StockTransferDetail | null>;
  findByStockTransferId(stockTransferId: string): Promise<StockTransferDetail[]>;
  findAll(
    pagination?: PaginationParams,
    filters?: StockTransferDetailFilters,
  ): Promise<PaginatedResult<StockTransferDetail>>;
  create(stockTransferDetail: StockTransferDetail): Promise<StockTransferDetail>;
}