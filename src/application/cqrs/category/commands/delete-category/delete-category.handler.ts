import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteCategoryCommand } from './delete-category.command';
import { DeleteCategoryValidator } from './delete-category.validator';
import { CATEGORY_REPOSITORY, PRODUCT_REPOSITORY } from '../../../../tokens';
import type { ICategoryRepository, IProductRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';

@CommandHandler(DeleteCategoryCommand)
export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryCommand> {
  constructor(
    private readonly validator: DeleteCategoryValidator,
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: ICategoryRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
  ) {}

  async execute(command: DeleteCategoryCommand): Promise<void> {
    const id = this.validator.validate(command.id);

    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new EntityNotFoundException('Category', id);
    }

    // Check if category is used in products
    const products = await this.productRepository.findAll(
      { page: 1, limit: 1 },
      { categoryId: id }
    );

    if (products.total > 0) {
      throw new BusinessRuleException('Cannot physically delete category with associated products. Deactivate it instead.');
    }

    await this.categoryRepository.softDelete(id);
  }
}
