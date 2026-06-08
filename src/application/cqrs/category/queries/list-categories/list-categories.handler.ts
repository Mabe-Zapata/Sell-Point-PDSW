import { ListCategoriesQuery } from './list-categories.query';
import { CATEGORY_REPOSITORY } from '../../../../tokens';
import type { ICategoryRepository } from '../../../../../domain/repositories';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { Category } from '../../../../../domain/entities';export class ListCategoriesHandler {
  constructor(
    protected readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(query: ListCategoriesQuery): Promise<PaginatedResult<Category>> {
    return this.categoryRepository.findAll(query.pagination, { q: query.q, isActive: query.isActive });
  }
}
