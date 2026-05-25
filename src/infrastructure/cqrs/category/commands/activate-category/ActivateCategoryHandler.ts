import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ActivateCategoryCommand } from '../../../../../application/cqrs/category/commands/activate-category/activate-category.command';
import { ActivateCategoryHandler as ApplicationActivateCategoryHandler } from '../../../../../application/cqrs/category/commands/activate-category/activate-category.handler';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CATEGORY_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(ActivateCategoryCommand)
export class ActivateCategoryHandler implements ICommandHandler<ActivateCategoryCommand> {
  private readonly appHandler: ApplicationActivateCategoryHandler;

  constructor(
    @Inject(CATEGORY_REPOSITORY) categoryRepository: CategoryRepository,
  ) {
    this.appHandler = new ApplicationActivateCategoryHandler(categoryRepository);
  }

  async execute(command: ActivateCategoryCommand) {
    return this.appHandler.execute(command);
  }
}
