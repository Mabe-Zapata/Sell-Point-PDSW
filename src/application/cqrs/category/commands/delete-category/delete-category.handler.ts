import { DeleteCategoryCommand } from './delete-category.command';
import type { ICategoryRepository, IProductRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';

export class DeleteCategoryHandler {
  constructor(
    protected readonly categoryRepository: ICategoryRepository,
    protected readonly productRepository: IProductRepository,
  ) {}

  async execute(command: DeleteCategoryCommand): Promise<void> {
    const id = command.id;

    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new EntityNotFoundException('Category', id);
    }

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
