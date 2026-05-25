import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeactivateCategoryCommand } from '../../../../../application/cqrs/category/commands/deactivate-category/deactivate-category.command';
import { DeactivateCategoryHandler as ApplicationDeactivateCategoryHandler } from '../../../../../application/cqrs/category/commands/deactivate-category/deactivate-category.handler';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CATEGORY_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(DeactivateCategoryCommand)
export class DeactivateCategoryHandler implements ICommandHandler<DeactivateCategoryCommand> {
  private readonly appHandler: ApplicationDeactivateCategoryHandler;

  constructor(
    @Inject(CATEGORY_REPOSITORY) categoryRepository: CategoryRepository,
  ) {
    this.appHandler = new ApplicationDeactivateCategoryHandler(categoryRepository);
  }

  async execute(command: DeactivateCategoryCommand) {
    return this.appHandler.execute(command);
  }
}
