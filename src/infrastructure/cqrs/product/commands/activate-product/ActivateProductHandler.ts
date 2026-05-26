import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ActivateProductCommand } from '../../../../../application/cqrs/product/commands/activate-product/activate-product.command';
import { ActivateProductHandler as ApplicationActivateProductHandler } from '../../../../../application/cqrs/product/commands/activate-product/activate-product.handler';
import { ProductRepository } from '../../../../repositories/product.repository';
import { PRODUCT_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(ActivateProductCommand)
export class ActivateProductHandler implements ICommandHandler<ActivateProductCommand> {
  private readonly appHandler: ApplicationActivateProductHandler;

  constructor(
    @Inject(PRODUCT_REPOSITORY) productRepository: ProductRepository,
  ) {
    this.appHandler = new ApplicationActivateProductHandler(productRepository);
  }

  async execute(command: ActivateProductCommand) {
    return this.appHandler.execute(command);
  }
}
