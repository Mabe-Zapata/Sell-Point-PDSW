import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CancelSaleCommand } from './cancel-sale.command';
import { CancelSaleValidator } from './cancel-sale.validator';
import { UNIT_OF_WORK } from '../../../../tokens';
import { CancelSaleUseCase } from '../../../../use-cases/sale/cancel-sale.use-case';
import type { IUnitOfWork } from '../../../../../application/unit-of-work/unit-of-work.interface';

@CommandHandler(CancelSaleCommand)
export class CancelSaleHandler implements ICommandHandler<CancelSaleCommand> {
  constructor(
    private readonly validator: CancelSaleValidator,
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
    private readonly cancelSaleUseCase: CancelSaleUseCase,
  ) {}

  async execute(command: CancelSaleCommand): Promise<void> {
    this.validator.validate(command.saleId);
    await this.cancelSaleUseCase.execute(command.saleId);
  }
}