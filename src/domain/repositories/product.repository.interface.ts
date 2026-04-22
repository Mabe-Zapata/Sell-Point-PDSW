import { Product } from '../entities/product.entity';
import {
  PaginationParams,
  PaginatedResult,
} from './customer.repository.interface';

// Re-export for convenience
export type {
  PaginationParams,
  PaginatedResult,
} from './customer.repository.interface';

export interface ProductFilters {
  q?: string;
}

/**
 * Product repository interface
 * Defines the contract for product data access operations
 */
export interface IProductRepository {
  /**
   * Find a product by ID
   */
  findById(id: string): Promise<Product | null>;

  /**
   * Find all products with pagination and filters (excluding soft-deleted)
   */
  findAll(
    pagination?: PaginationParams,
    filters?: ProductFilters,
  ): Promise<PaginatedResult<Product>>;

  /**
   * Create a new product
   */
  create(product: Product): Promise<Product>;

  /**
   * Update an existing product
   */
  update(product: Product): Promise<Product>;

  /**
   * Decrement product stock by a given quantity
   * Throws InsufficientStockException if not enough stock available
   */
  decrementStock(id: string, quantity: number): Promise<Product>;

  /**
   * Soft delete a product (mark as deleted)
   */
  softDelete(id: string): Promise<void>;
}
