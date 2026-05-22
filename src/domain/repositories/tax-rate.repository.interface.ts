import { TaxRate } from '../entities';
import { PaginationParams, PaginatedResult } from './pagination.types';

export interface TaxRateFilters {
  q?: string;
  isActive?: boolean;
}

export interface ITaxRateRepository {
  findById(id: string): Promise<TaxRate | null>;
  findByName(name: string): Promise<TaxRate | null>;
  findAll(
    pagination?: PaginationParams,
    filters?: TaxRateFilters,
  ): Promise<PaginatedResult<TaxRate>>;
  create(taxRate: TaxRate): Promise<TaxRate>;
  update(taxRate: TaxRate): Promise<TaxRate>;
}
