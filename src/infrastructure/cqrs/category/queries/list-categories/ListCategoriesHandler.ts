import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListCategoriesQuery } from '../../../../../application/cqrs/category/queries/list-categories/list-categories.query';
import { ListCategoriesHandler as ApplicationListCategoriesHandler } from '../../../../../application/cqrs/category/queries/list-categories/list-categories.handler';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CATEGORY_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(ListCategoriesQuery)
export class ListCategoriesHandler implements IQueryHandler<ListCategoriesQuery> {
  private readonly appHandler: ApplicationListCategoriesHandler;

  constructor(
    @Inject(CATEGORY_REPOSITORY) categoryRepository: CategoryRepository,
  ) {
    this.appHandler = new ApplicationListCategoriesHandler(categoryRepository);
  }

  async execute(query: ListCategoriesQuery) {
    return this.appHandler.execute(query);
  }
}
