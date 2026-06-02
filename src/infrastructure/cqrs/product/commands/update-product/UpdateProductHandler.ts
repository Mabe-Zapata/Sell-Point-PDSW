import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateProductCommand } from '../../../../../application/cqrs/product/commands/update-product/update-product.command';
import { UpdateProductHandler as ApplicationUpdateProductHandler } from '../../../../../application/cqrs/product/commands/update-product/update-product.handler';
import { ProductRepository } from '../../../../repositories/product.repository';
import { LotRepository } from '../../../../repositories/lot.repository';
import { LOT_REPOSITORY, PRODUCT_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand> {
  private readonly appHandler: ApplicationUpdateProductHandler;

  constructor(
    @Inject(PRODUCT_REPOSITORY) productRepository: ProductRepository,
    @Inject(LOT_REPOSITORY) lotRepository: LotRepository,
  ) {
    this.appHandler = new ApplicationUpdateProductHandler(productRepository, lotRepository);
  }

  async execute(command: UpdateProductCommand) {
    return this.appHandler.execute(command);
  }
}
