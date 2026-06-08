import { AddSaleDetailCommand } from './add-sale-detail.command';
import type { ISaleRepository, ISaleDetailRepository } from '../../../../../domain/repositories';
import { Sale, SaleDetail } from '../../../../../domain/entities';

export class AddSaleDetailHandler {
  constructor(
    private readonly saleRepository: ISaleRepository,
    private readonly saleDetailRepository: ISaleDetailRepository,
  ) {}

  async execute(command: AddSaleDetailCommand): Promise<SaleDetail> {
    const sale = await this.saleRepository.findById(command.payload.saleId);
    if (!sale) {
      throw new Error(`Sale with ID '${command.payload.saleId}' not found`);
    }

    const detail = new SaleDetail({
      saleId: command.payload.saleId,
      productId: command.payload.productId,
      quantity: command.payload.quantity,
      unitPrice: command.payload.unitPrice,
    });

    return this.saleDetailRepository.create(detail);
  }
}