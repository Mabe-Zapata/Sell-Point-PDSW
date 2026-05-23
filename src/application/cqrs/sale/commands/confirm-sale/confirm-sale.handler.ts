import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ConfirmSaleCommand } from './confirm-sale.command';
import { ConfirmSaleValidator } from './confirm-sale.validator';
import { SALE_REPOSITORY } from '../../../../tokens';
import type { ISaleRepository } from '../../../../../domain/repositories';
import { SaleStatus } from '../../../../../domain/entities';

@CommandHandler(ConfirmSaleCommand)
export class ConfirmSaleHandler implements ICommandHandler<ConfirmSaleCommand> {
  constructor(
    private readonly validator: ConfirmSaleValidator,
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
  ) {}

  async execute(command: ConfirmSaleCommand): Promise<void> {
    this.validator.validate(command.saleId);

    const sale = await this.saleRepository.findById(command.saleId);
    if (!sale) {
      throw new Error(`Sale with ID '${command.saleId}' not found`);
    }

    const updated = { ...sale, status: SaleStatus.CONFIRMED };
    await this.saleRepository.update(updated as any);
  }
}