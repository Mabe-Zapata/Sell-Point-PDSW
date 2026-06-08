import { GetCategoryQuery } from './get-category.query';
import type { ICategoryRepository } from '../../../../../domain/repositories';
import { Category } from '../../../../../domain/entities';

export class GetCategoryHandler {
  constructor(
    protected readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(query: GetCategoryQuery): Promise<Category | null> {
    return this.categoryRepository.findById(query.id);
  }
}
