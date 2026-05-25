import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ActivateCategoryCommand } from './activate-category.command';
import { ActivateCategoryValidator } from './activate-category.validator';
import { CATEGORY_REPOSITORY } from '../../../../tokens';
import type { ICategoryRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Category } from '../../../../../domain/entities/category.entity';

@CommandHandler(ActivateCategoryCommand)
export class ActivateCategoryHandler implements ICommandHandler<ActivateCategoryCommand> {
  constructor(
    private readonly validator: ActivateCategoryValidator,
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(command: ActivateCategoryCommand): Promise<Category> {
    const id = this.validator.validate(command.id);

    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new EntityNotFoundException('Category', id);
    }

    category.activate();

    return this.categoryRepository.update(category);
  }
}
