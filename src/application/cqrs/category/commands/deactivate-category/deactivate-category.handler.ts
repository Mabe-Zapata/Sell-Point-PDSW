import { DeactivateCategoryCommand } from './deactivate-category.command';
import type { ICategoryRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Category } from '../../../../../domain/entities/category.entity';

export class DeactivateCategoryHandler {
  constructor(
    protected readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(command: DeactivateCategoryCommand): Promise<Category> {
    const id = command.id;

    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new EntityNotFoundException('Category', id);
    }

    category.deactivate();

    return this.categoryRepository.update(category);
  }
}
