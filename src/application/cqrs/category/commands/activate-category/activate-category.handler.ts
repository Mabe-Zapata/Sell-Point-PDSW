import { ActivateCategoryCommand } from './activate-category.command';
import type { ICategoryRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Category } from '../../../../../domain/entities/category.entity';

export class ActivateCategoryHandler {
  constructor(
    protected readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(command: ActivateCategoryCommand): Promise<Category> {
    const id = command.id;

    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new EntityNotFoundException('Category', id);
    }

    category.activate();

    return this.categoryRepository.update(category);
  }
}
