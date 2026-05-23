import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListCategoriesQuery } from './list-categories.query';
import { ListCategoriesValidator } from './list-categories.validator';
import { CATEGORY_REPOSITORY } from '../../../../tokens';
import type { ICategoryRepository } from '../../../../../domain/repositories';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { Category } from '../../../../../domain/entities';

@QueryHandler(ListCategoriesQuery)
export class ListCategoriesHandler implements IQueryHandler<ListCategoriesQuery> {
  constructor(
    private readonly validator: ListCategoriesValidator,
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(query: ListCategoriesQuery): Promise<PaginatedResult<Category>> {
    const validPagination = this.validator.validate(query.pagination);
    return this.categoryRepository.findAll(validPagination, { q: query.q, isActive: query.isActive });
  }
}