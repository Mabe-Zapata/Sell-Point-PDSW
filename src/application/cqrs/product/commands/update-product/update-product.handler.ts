import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateProductCommand } from './update-product.command';
import { UpdateProductValidator } from './update-product.validator';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Product } from '../../../../../domain/entities/product.entity';

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand> {
  constructor(
    private readonly validator: UpdateProductValidator,
    private readonly productRepository: ProductRepository,
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
      code: payload.code ?? existingProduct.code,
      name: payload.name ?? existingProduct.name,
      description:
        payload.description !== undefined
          ? payload.description
          : existingProduct.description,
      unitPrice: payload.unitPrice ?? existingProduct.unitPrice,
      availableQuantity:
        payload.availableQuantity ?? existingProduct.availableQuantity,
      createdAt: existingProduct.createdAt,
      updatedAt: new Date(),
    });

    return this.productRepository.update(updatedProduct);
  }
}
