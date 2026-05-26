import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeactivateProductCommand } from '../../../../../application/cqrs/product/commands/deactivate-product/deactivate-product.command';
import { DeactivateProductHandler as ApplicationDeactivateProductHandler } from '../../../../../application/cqrs/product/commands/deactivate-product/deactivate-product.handler';
import { ProductRepository } from '../../../../repositories/product.repository';
import { PRODUCT_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(DeactivateProductCommand)
export class DeactivateProductHandler implements ICommandHandler<DeactivateProductCommand> {
  private readonly appHandler: ApplicationDeactivateProductHandler;

  constructor(
    @Inject(PRODUCT_REPOSITORY) productRepository: ProductRepository,
  ) {
    this.appHandler = new ApplicationDeactivateProductHandler(productRepository);
  }

  async execute(command: DeactivateProductCommand) {
    return this.appHandler.execute(command);
  }
}
