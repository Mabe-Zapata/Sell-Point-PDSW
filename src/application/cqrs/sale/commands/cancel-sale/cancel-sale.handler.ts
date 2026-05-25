import { CancelSaleCommand } from './cancel-sale.command';
import { CancelSaleUseCase } from '../../../../use-cases/sale/cancel-sale.use-case';

export class CancelSaleHandler {
  constructor(
    protected readonly cancelSaleUseCase: CancelSaleUseCase,
  ) {}

  async execute(command: CancelSaleCommand): Promise<void> {
    await this.cancelSaleUseCase.execute(command.saleId);
  }
}
