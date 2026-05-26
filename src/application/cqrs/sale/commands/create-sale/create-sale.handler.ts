import { CreateSaleCommand } from './create-sale.command';
import type { ISaleRepository } from '../../../../../domain/repositories';
import { Sale, SaleStatus } from '../../../../../domain/entities';
import { v4 as uuidv4 } from 'uuid';

export class CreateSaleHandler {
  constructor(
    protected readonly saleRepository: ISaleRepository,
  ) {}

  async execute(command: CreateSaleCommand): Promise<Sale> {
    const saleNumber = `SAL-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    const sale = new Sale({
      branchId: command.payload.branchId,
      customerId: command.payload.customerId,
      cashierUserId: command.payload.cashierUserId,
      taxRateId: command.payload.taxRateId,
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