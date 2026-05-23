import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateCategoryCommand } from './update-category.command';
import { UpdateCategoryValidator } from './update-category.validator';
import { CATEGORY_REPOSITORY } from '../../../../tokens';
import type { ICategoryRepository } from '../../../../../domain/repositories';
import { Category } from '../../../../../domain/entities';

@CommandHandler(UpdateCategoryCommand)
export class UpdateCategoryHandler implements ICommandHandler<UpdateCategoryCommand> {
  constructor(
    private readonly validator: UpdateCategoryValidator,
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(command: UpdateCategoryCommand): Promise<Category> {
    this.validator.validate(command.id, command.payload);

    const existing = await this.categoryRepository.findById(command.id);
    if (!existing) {
      throw new Error(`Category with ID '${command.id}' not found`);
    }

    if (command.payload.name && command.payload.name !== existing.name) {
      const nameConflict = await this.categoryRepository.findByName(command.payload.name);
      if (nameConflict && nameConflict.id !== command.id) {
        throw new Error(`Category with name '${command.payload.name}' already exists`);
      }
    }

    const updated = new Category({
      id: existing.id,
      name: command.payload.name ?? existing.name,
      description: command.payload.description ?? existing.description,
      isActive: command.payload.isActive ?? existing.isActive,
      createdAt: existing.createdAt,
    });

    return this.categoryRepository.update(updated);
  }
}