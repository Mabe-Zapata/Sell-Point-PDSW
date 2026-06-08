import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateSaleCommand } from '../../../../../application/cqrs/sale/commands/create-sale/create-sale.command';
import { CreateSaleHandler as ApplicationCreateSaleHandler } from '../../../../../application/cqrs/sale/commands/create-sale/create-sale.handler';
import { SaleRepository } from '../../../../repositories/sale.repository';
import { SALE_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(CreateSaleCommand)
export class CreateSaleHandler implements ICommandHandler<CreateSaleCommand> {
  private readonly appHandler: ApplicationCreateSaleHandler;

  constructor(
    @Inject(SALE_REPOSITORY) saleRepository: SaleRepository,
  ) {
    this.appHandler = new ApplicationCreateSaleHandler(saleRepository);
  }

  async execute(command: CreateSaleCommand) {
    return this.appHandler.execute(command);
  }
}
