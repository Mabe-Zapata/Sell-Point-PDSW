import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeactivateCategoryCommand } from './deactivate-category.command';
import { DeactivateCategoryValidator } from './deactivate-category.validator';
import { CATEGORY_REPOSITORY } from '../../../../tokens';
import type { ICategoryRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Category } from '../../../../../domain/entities/category.entity';

@CommandHandler(DeactivateCategoryCommand)
export class DeactivateCategoryHandler implements ICommandHandler<DeactivateCategoryCommand> {
  constructor(
    private readonly validator: DeactivateCategoryValidator,
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(command: DeactivateCategoryCommand): Promise<Category> {
    const id = this.validator.validate(command.id);

    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new EntityNotFoundException('Category', id);
    }

    category.deactivate();

    return this.categoryRepository.update(category);
  }
}
