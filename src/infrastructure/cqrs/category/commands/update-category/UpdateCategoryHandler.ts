import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateCategoryCommand } from '../../../../../application/cqrs/category/commands/update-category/update-category.command';
import { UpdateCategoryHandler as ApplicationUpdateCategoryHandler } from '../../../../../application/cqrs/category/commands/update-category/update-category.handler';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CATEGORY_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(UpdateCategoryCommand)
export class UpdateCategoryHandler implements ICommandHandler<UpdateCategoryCommand> {
  private readonly appHandler: ApplicationUpdateCategoryHandler;

  constructor(
    @Inject(CATEGORY_REPOSITORY) categoryRepository: CategoryRepository,
  ) {
    this.appHandler = new ApplicationUpdateCategoryHandler(categoryRepository);
  }

  async execute(command: UpdateCategoryCommand) {
    return this.appHandler.execute(command);
  }
}
