import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteCategoryCommand } from '../../../../../application/cqrs/category/commands/delete-category/delete-category.command';
import { DeleteCategoryHandler as ApplicationDeleteCategoryHandler } from '../../../../../application/cqrs/category/commands/delete-category/delete-category.handler';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { ProductRepository } from '../../../../repositories/product.repository';
import { CATEGORY_REPOSITORY, PRODUCT_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(DeleteCategoryCommand)
export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryCommand> {
  private readonly appHandler: ApplicationDeleteCategoryHandler;

  constructor(
    @Inject(CATEGORY_REPOSITORY) categoryRepository: CategoryRepository,
    @Inject(PRODUCT_REPOSITORY) productRepository: ProductRepository,
  ) {
    this.appHandler = new ApplicationDeleteCategoryHandler(categoryRepository, productRepository);
  }

  async execute(command: DeleteCategoryCommand) {
    return this.appHandler.execute(command);
  }
}
