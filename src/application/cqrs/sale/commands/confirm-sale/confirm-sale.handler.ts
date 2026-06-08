import { ConfirmSaleCommand } from './confirm-sale.command';
import { ConfirmSaleUseCase } from '../../../../use-cases/sale/confirm-sale.use-case';
import type { IUnitOfWork } from '../../../../unit-of-work/unit-of-work.interface';

export class ConfirmSaleHandler {
  constructor(private readonly uow: IUnitOfWork) {}

  async execute(command: ConfirmSaleCommand): Promise<void> {
    const useCase = new ConfirmSaleUseCase(this.uow);
    return useCase.execute(command.saleId);
  }
}