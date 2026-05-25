import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateCategoryCommand } from '../../../../../application/cqrs/category/commands/create-category/create-category.command';
import { CreateCategoryHandler as ApplicationCreateCategoryHandler } from '../../../../../application/cqrs/category/commands/create-category/create-category.handler';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CATEGORY_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler implements ICommandHandler<CreateCategoryCommand> {
  private readonly appHandler: ApplicationCreateCategoryHandler;

  constructor(
    @Inject(CATEGORY_REPOSITORY) categoryRepository: CategoryRepository,
  ) {
    this.appHandler = new ApplicationCreateCategoryHandler(categoryRepository);
  }

  async execute(command: CreateCategoryCommand) {
    return this.appHandler.execute(command);
  }
}
