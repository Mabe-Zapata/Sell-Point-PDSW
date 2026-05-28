import { Sale } from '../entities';
import { PaginationParams, PaginatedResult } from './pagination.types';

export interface SaleFilters {
  q?: string;
  branchId?: string;
  customerId?: string;
  cashierUserId?: string;
  status?: string;
}

export interface ISaleRepository {
  findById(id: string): Promise<Sale | null>;
  findBySaleNumber(saleNumber: string): Promise<Sale | null>;
  getNextSaleNumber(): Promise<string>;
  findAll(
    pagination?: PaginationParams,
    filters?: SaleFilters,
  ): Promise<PaginatedResult<Sale>>;
  create(sale: Sale): Promise<Sale>;
  update(sale: Sale): Promise<Sale>;
  findByIdWithDetails(id: string): Promise<Sale | null>;
}
