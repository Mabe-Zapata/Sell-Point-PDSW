import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetCategoryQuery } from '../../../../../application/cqrs/category/queries/get-category/get-category.query';
import { GetCategoryHandler as ApplicationGetCategoryHandler } from '../../../../../application/cqrs/category/queries/get-category/get-category.handler';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CATEGORY_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(GetCategoryQuery)
export class GetCategoryHandler implements IQueryHandler<GetCategoryQuery> {
  private readonly appHandler: ApplicationGetCategoryHandler;

  constructor(
    @Inject(CATEGORY_REPOSITORY) categoryRepository: CategoryRepository,
  ) {
    this.appHandler = new ApplicationGetCategoryHandler(categoryRepository);
  }

  async execute(query: GetCategoryQuery) {
    return this.appHandler.execute(query);
  }
}
