import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CancelSaleCommand } from '../../../../../application/cqrs/sale/commands/cancel-sale/cancel-sale.command';
import { CancelSaleUseCase } from '../../../../../application/use-cases/sale/cancel-sale.use-case';
import { TypeOrmUnitOfWork } from '../../../../persistence/typeorm/unit-of-work/typeorm-unit-of-work';
import { UNIT_OF_WORK } from '../../../../common/injection-tokens';

@CommandHandler(CancelSaleCommand)
export class CancelSaleHandler implements ICommandHandler<CancelSaleCommand> {
  private readonly useCase: CancelSaleUseCase;

  constructor(
    @Inject(UNIT_OF_WORK) uow: TypeOrmUnitOfWork,
  ) {
    this.useCase = new CancelSaleUseCase(uow);
  }

  async execute(command: CancelSaleCommand) {
    return this.useCase.execute(command.saleId);
  }
}