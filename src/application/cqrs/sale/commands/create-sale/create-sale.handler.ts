import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateSaleCommand } from './create-sale.command';
import { CreateSaleValidator } from './create-sale.validator';
import { SALE_REPOSITORY } from '../../../../tokens';
import type { ISaleRepository } from '../../../../../domain/repositories';
import { Sale, SaleStatus } from '../../../../../domain/entities';
import { v4 as uuidv4 } from 'uuid';

@CommandHandler(CreateSaleCommand)
export class CreateSaleHandler implements ICommandHandler<CreateSaleCommand> {
  constructor(
    private readonly validator: CreateSaleValidator,
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
  ) {}

  async execute(command: CreateSaleCommand): Promise<Sale> {
    this.validator.validate(command.payload);

    const saleNumber = `SAL-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    const sale = new Sale({
      branchId: command.payload.branchId,
      customerId: command.payload.customerId,
      cashierUserId: command.payload.cashierUserId,
      taxRateId: command.payload.taxRateId,
      saleNumber,
      status: SaleStatus.DRAFT,
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      total: 0,
    });

    return this.saleRepository.create(sale);
  }
}