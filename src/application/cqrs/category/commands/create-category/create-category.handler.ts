import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateCategoryCommand } from './create-category.command';
import { CreateCategoryValidator } from './create-category.validator';
import { CATEGORY_REPOSITORY } from '../../../../tokens';
import type { ICategoryRepository } from '../../../../../domain/repositories';
import { Category } from '../../../../../domain/entities';

@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler implements ICommandHandler<CreateCategoryCommand> {
  constructor(
    private readonly validator: CreateCategoryValidator,
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(command: CreateCategoryCommand): Promise<Category> {
    this.validator.validate(command.payload);

    const existing = await this.categoryRepository.findByName(command.payload.name);
    if (existing) {
      throw new Error(`Category with name '${command.payload.name}' already exists`);
    }

    const category = new Category({
      id: randomUUID(),
      name: command.payload.name,
      description: command.payload.description,
      isActive: true,
    });

    return this.categoryRepository.create(category);
  }
}