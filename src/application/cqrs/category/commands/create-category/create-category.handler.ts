import { randomUUID } from 'crypto';
import { CreateCategoryCommand } from './create-category.command';
import type { ICategoryRepository } from '../../../../../domain/repositories';
import { Category } from '../../../../../domain/entities';

export class CreateCategoryHandler {
  constructor(
    protected readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(command: CreateCategoryCommand): Promise<Category> {
    const existing = await this.categoryRepository.findByName(command.payload.name);
    if (existing) {
      throw new Error(`Category with name '${command.payload.name}' already exists`);
    }

    // TODO: inject IUuidGenerator once ports are wired.
    const category = new Category({
      id: randomUUID(),
      name: command.payload.name,
      description: command.payload.description,
      isActive: true,
    });

    return this.categoryRepository.create(category);
  }
}
