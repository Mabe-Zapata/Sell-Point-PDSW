import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CancelSaleCommand } from './cancel-sale.command';
import { CancelSaleValidator } from './cancel-sale.validator';
import { SALE_REPOSITORY } from '../../../../tokens';
import type { ISaleRepository } from '../../../../../domain/repositories';
import { SaleStatus } from '../../../../../domain/entities';

@CommandHandler(CancelSaleCommand)
export class CancelSaleHandler implements ICommandHandler<CancelSaleCommand> {
  constructor(
    private readonly validator: CancelSaleValidator,
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
  ) {}

  async execute(command: CancelSaleCommand): Promise<void> {
    this.validator.validate(command.saleId);

    const sale = await this.saleRepository.findById(command.saleId);
    if (!sale) {
      throw new Error(`Sale with ID '${command.saleId}' not found`);
    }

    const updated = { ...sale, status: SaleStatus.CANCELLED };
    await this.saleRepository.update(updated as any);
  }
}