import { randomUUID } from 'crypto';
import { CreateSaleCommand } from './create-sale.command';
import type { ISaleRepository } from '../../../../../domain/repositories';
import { Sale, SaleStatus } from '../../../../../domain/entities';

export class CreateSaleHandler {
  constructor(
    protected readonly saleRepository: ISaleRepository,
  ) {}

  async execute(command: CreateSaleCommand): Promise<Sale> {
    const saleNumber = await this.saleRepository.getNextSaleNumber();

    const sale = new Sale({
      id: randomUUID(),
      branchId: command.payload.branchId,
      customerId: command.payload.customerId,
      cashierUserId: command.payload.cashierUserId,
      paymentMethod: command.payload.paymentMethod,
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
