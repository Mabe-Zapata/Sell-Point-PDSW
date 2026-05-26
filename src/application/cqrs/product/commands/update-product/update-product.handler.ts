import { UpdateProductCommand } from './update-product.command';
import type { IProductRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Product } from '../../../../../domain/entities/product.entity';

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

    const updatedProduct = new Product({
      id: existingProduct.id,
      categoryId: payload.categoryId ?? existingProduct.categoryId,
      code: payload.code ?? existingProduct.code,
      name: payload.name ?? existingProduct.name,
      description:
        payload.description !== undefined
          ? payload.description
          : existingProduct.description,
      salePrice: payload.salePrice ?? existingProduct.salePrice,
      costPrice: payload.costPrice ?? existingProduct.costPrice,
      currentStock: existingProduct.currentStock,
      isActive: existingProduct.isActive,
      createdAt: existingProduct.createdAt,
    });

    return this.productRepository.update(updatedProduct);
  }
}
