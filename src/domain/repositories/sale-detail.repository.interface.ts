import { SaleDetail } from '../entities';
import { PaginationParams, PaginatedResult } from './customer.repository.interface';

export interface SaleDetailFilters {
  saleId?: string;
  productId?: string;
}

export interface ISaleDetailRepository {
  findById(id: string): Promise<SaleDetail | null>;
  findBySaleId(saleId: string): Promise<SaleDetail[]>;
  findAll(
    pagination?: PaginationParams,
    filters?: SaleDetailFilters,
  ): Promise<PaginatedResult<SaleDetail>>;
  create(saleDetail: SaleDetail): Promise<SaleDetail>;
  update(saleDetail: SaleDetail): Promise<SaleDetail>;
  deleteBySaleId(saleId: string): Promise<void>;
}