import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ConfirmSaleCommand } from './confirm-sale.command';
import { ConfirmSaleValidator } from './confirm-sale.validator';
import { UNIT_OF_WORK } from '../../../../tokens';
import { ConfirmSaleUseCase } from '../../../../use-cases/sale/confirm-sale.use-case';
import type { IUnitOfWork } from '../../../../../application/unit-of-work/unit-of-work.interface';

@CommandHandler(ConfirmSaleCommand)
export class ConfirmSaleHandler implements ICommandHandler<ConfirmSaleCommand> {
  constructor(
    private readonly validator: ConfirmSaleValidator,
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
    private readonly confirmSaleUseCase: ConfirmSaleUseCase,
  ) {}

  async execute(command: ConfirmSaleCommand): Promise<void> {
    this.validator.validate(command.saleId);
    await this.confirmSaleUseCase.execute(command.saleId);
  }
}