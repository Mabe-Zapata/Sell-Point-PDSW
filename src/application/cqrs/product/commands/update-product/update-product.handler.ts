import { UpdateProductCommand } from './update-product.command';
import type { IProductRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Product } from '../../../../../domain/entities/product.entity';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';

export class UpdateProductHandler {
  constructor(
    protected readonly productRepository: IProductRepository,
  ) {}

  async execute(command: UpdateProductCommand): Promise<Product> {
    const id = command.id;
    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) {
      throw new EntityNotFoundException('Product', id);
    }

    const { payload } = command;

    if (payload.code !== undefined && payload.code.trim().length > 0 && payload.code.trim() !== existingProduct.code) {
      throw new BusinessRuleException('Product code cannot be updated');
    }

    const nextName = payload.name?.trim() ?? existingProduct.name;
    const nextDescription = payload.description !== undefined
      ? payload.description.trim()
      : existingProduct.description;
    const nextSalePrice = payload.salePrice ?? existingProduct.salePrice;
    const nextCostPrice = payload.costPrice ?? existingProduct.costPrice;

    if (nextCostPrice > nextSalePrice) {
      throw new BusinessRuleException('Cost price cannot be greater than sale price');
    }

    const updatedProduct = new Product({
      id: existingProduct.id,
      categoryId: payload.categoryId ?? existingProduct.categoryId,
      code: existingProduct.code,
      name: nextName,
      description: nextDescription,
      salePrice: nextSalePrice,
      costPrice: nextCostPrice,
      currentStock: existingProduct.currentStock,
      isActive: existingProduct.isActive,
      createdAt: existingProduct.createdAt,
    });

    const saved = await this.productRepository.update(updatedProduct);
    return saved;
  }
}
