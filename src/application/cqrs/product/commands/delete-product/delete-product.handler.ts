import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteProductCommand } from './delete-product.command';
import { DeleteProductValidator } from './delete-product.validator';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';

@CommandHandler(DeleteProductCommand)
export class DeleteProductHandler implements ICommandHandler<DeleteProductCommand> {
  constructor(
    private readonly validator: DeleteProductValidator,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(command: DeleteProductCommand): Promise<void> {
    const id = this.validator.validate(command.id);
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new EntityNotFoundException('Product', id);
    }
    await this.productRepository.softDelete(id);
  }
}
