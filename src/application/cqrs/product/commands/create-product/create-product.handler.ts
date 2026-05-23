import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateProductCommand } from './create-product.command';
import { CreateProductValidator } from './create-product.validator';
import { PRODUCT_REPOSITORY } from '../../../../tokens';
import type { IProductRepository } from '../../../../../domain/repositories';
import { Product } from '../../../../../domain/entities/product.entity';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  constructor(
    private readonly validator: CreateProductValidator,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
  ) {}

  async execute(command: CreateProductCommand): Promise<Product> {
    await this.validator.validate(command.payload);

    const product = new Product({
      categoryId: command.payload.categoryId,
      code: command.payload.code,
      name: command.payload.name,
      description: command.payload.description,
      salePrice: command.payload.salePrice,
      costPrice: command.payload.costPrice,
      isActive: true,
    });

    return this.productRepository.create(product);
  }
}
