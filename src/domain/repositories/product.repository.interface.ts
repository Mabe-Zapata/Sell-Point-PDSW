import { Product } from '../entities';
import { PaginationParams, PaginatedResult } from './customer.repository.interface';

export interface ProductFilters {
  q?: string;
  categoryId?: string;
  isActive?: boolean;
}

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findByCode(code: string): Promise<Product | null>;
  findAll(
    pagination?: PaginationParams,
    filters?: ProductFilters,
  ): Promise<PaginatedResult<Product>>;
  create(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  softDelete(id: string): Promise<void>;
}