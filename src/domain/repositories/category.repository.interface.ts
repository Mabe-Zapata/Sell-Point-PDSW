import { Category } from '../entities';
import { PaginationParams, PaginatedResult } from './pagination.types';

export interface CategoryFilters {
  q?: string;
  isActive?: boolean;
}

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  findAll(
    pagination?: PaginationParams,
    filters?: CategoryFilters,
  ): Promise<PaginatedResult<Category>>;
  create(category: Category): Promise<Category>;
  update(category: Category): Promise<Category>;
  softDelete(id: string): Promise<void>;
}
