import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateProductCommand } from './create-product.command';
import { CreateProductValidator } from './create-product.validator';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';
import { Product } from '../../../../../domain/entities/product.entity';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  constructor(
    private readonly validator: CreateProductValidator,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(command: CreateProductCommand): Promise<Product> {
    await this.validator.validate(command.payload);

    const product = new Product({
      code: command.payload.code,
      name: command.payload.name,
      description: command.payload.description,
      unitPrice: command.payload.unitPrice,
      availableQuantity: command.payload.availableQuantity,
    });

    return this.productRepository.create(product);
  }
}
