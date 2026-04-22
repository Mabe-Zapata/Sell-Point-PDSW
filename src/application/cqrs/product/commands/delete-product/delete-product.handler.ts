import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteProductCommand } from './delete-product.command';
import { DeleteProductValidator } from './delete-product.validator';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';

@CommandHandler(DeleteProductCommand)
export class DeleteProductHandler implements ICommandHandler<DeleteProductCommand> {
  constructor(
    private readonly validator: DeleteProductValidator,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(command: DeleteProductCommand): Promise<void> {
    await this.validator.validate(command.id);
    await this.productRepository.softDelete(command.id);
  }
}
