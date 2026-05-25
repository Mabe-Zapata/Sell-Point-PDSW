import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ConfirmSaleCommand } from '../../../../../application/cqrs/sale/commands/confirm-sale/confirm-sale.command';
import { ConfirmSaleHandler as ApplicationConfirmSaleHandler } from '../../../../../application/cqrs/sale/commands/confirm-sale/confirm-sale.handler';
import { ConfirmSaleUseCase } from '../../../../../application/use-cases/sale/confirm-sale.use-case';
import { TypeOrmUnitOfWork } from '../../../../persistence/typeorm/unit-of-work/typeorm-unit-of-work';
import { UNIT_OF_WORK } from '../../../../common/injection-tokens';

@CommandHandler(ConfirmSaleCommand)
export class ConfirmSaleHandler implements ICommandHandler<ConfirmSaleCommand> {
  private readonly appHandler: ApplicationConfirmSaleHandler;

  constructor(
    @Inject(UNIT_OF_WORK) uow: TypeOrmUnitOfWork,
  ) {
    this.appHandler = new ApplicationConfirmSaleHandler(new ConfirmSaleUseCase(uow));
  }

  async execute(command: ConfirmSaleCommand) {
    return this.appHandler.execute(command);
  }
}
