import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeactivateProductCommand } from './deactivate-product.command';
import { DeactivateProductValidator } from './deactivate-product.validator';
import { PRODUCT_REPOSITORY } from '../../../../tokens';
import type { IProductRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Product } from '../../../../../domain/entities/product.entity';

@CommandHandler(DeactivateProductCommand)
export class DeactivateProductHandler implements ICommandHandler<DeactivateProductCommand> {
  constructor(
    private readonly validator: DeactivateProductValidator,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
  ) {}

  async execute(command: DeactivateProductCommand): Promise<Product> {
    this.validator.validate(command.id);

    const product = await this.productRepository.findById(command.id);
    if (!product) {
      throw new EntityNotFoundException('Product', command.id);
    }

    product.deactivate();

    return this.productRepository.update(product);
  }
}