import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateProductCommand } from './update-product.command';
import { UpdateProductValidator } from './update-product.validator';
import { PRODUCT_REPOSITORY } from '../../../../tokens';
import type { IProductRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Product } from '../../../../../domain/entities/product.entity';

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand> {
  constructor(
    private readonly validator: UpdateProductValidator,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
  ) {}

  async execute(command: UpdateProductCommand): Promise<Product> {
    const id = this.validator.validate(command.id);
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
      isActive: payload.isActive ?? existingProduct.isActive,
      createdAt: existingProduct.createdAt,
      updatedAt: new Date(),
    });

    return this.productRepository.update(updatedProduct);
  }
}
