import { ConfirmSaleCommand } from './confirm-sale.command';
import { ConfirmSaleUseCase } from '../../../../use-cases/sale/confirm-sale.use-case';

export class ConfirmSaleHandler {
  constructor(
    protected readonly confirmSaleUseCase: ConfirmSaleUseCase,
  ) {}

  async execute(command: ConfirmSaleCommand): Promise<void> {
    await this.confirmSaleUseCase.execute(command.saleId);
  }
}
