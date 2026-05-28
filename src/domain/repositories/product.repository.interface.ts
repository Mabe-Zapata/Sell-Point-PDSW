import { Product } from '../entities';
import { PaginationParams, PaginatedResult } from './pagination.types';

export interface ProductFilters {
  q?: string;
  categoryId?: string;
  isActive?: boolean;
}

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findByCode(code: string): Promise<Product | null>;
  getNextCode(): Promise<string>;
  findAll(
    pagination?: PaginationParams,
    filters?: ProductFilters,
  ): Promise<PaginatedResult<Product>>;
  create(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  softDelete(id: string): Promise<void>;
  findByIdForUpdate(id: string): Promise<Product | null>;
  incrementStock(id: string, quantity: number): Promise<void>;
  decrementStock(id: string, quantity: number): Promise<void>;
}
