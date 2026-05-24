import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ActivateProductCommand } from './activate-product.command';
import { ActivateProductValidator } from './activate-product.validator';
import { PRODUCT_REPOSITORY } from '../../../../tokens';
import type { IProductRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Product } from '../../../../../domain/entities/product.entity';

@CommandHandler(ActivateProductCommand)
export class ActivateProductHandler implements ICommandHandler<ActivateProductCommand> {
  constructor(
    private readonly validator: ActivateProductValidator,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
  ) {}

  async execute(command: ActivateProductCommand): Promise<Product> {
    this.validator.validate(command.id);

    const product = await this.productRepository.findById(command.id);
    if (!product) {
      throw new EntityNotFoundException('Product', command.id);
    }

    product.activate();

    return this.productRepository.update(product);
  }
}