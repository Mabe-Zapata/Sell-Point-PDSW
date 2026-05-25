import { AddSaleDetailCommand } from './add-sale-detail.command';
import type { ISaleRepository, ISaleDetailRepository } from '../../../../../domain/repositories';
import { SaleDetail, SaleStatus } from '../../../../../domain/entities';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';

export class AddSaleDetailHandler {
  constructor(
    protected readonly saleRepository: ISaleRepository,
    protected readonly saleDetailRepository: ISaleDetailRepository,
  ) {}

  async execute(command: AddSaleDetailCommand): Promise<SaleDetail> {
    const sale = await this.saleRepository.findById(command.payload.saleId);
    if (!sale) {
      throw new Error(`Sale with ID '${command.payload.saleId}' not found`);
    }

    // R25: Sale modification before confirmation only
    if (sale.status !== SaleStatus.DRAFT) {
      throw new BusinessRuleException('Sale cannot be modified after confirmation');
    }

    // R24: Check if product already exists in sale_details
    const existingDetails = await this.saleDetailRepository.findBySaleId(command.payload.saleId);
    const existingDetail = existingDetails.find(d => d.productId === command.payload.productId);

    if (existingDetail) {
      // Increment quantity instead of creating new row
      const updatedDetail = new SaleDetail({
        ...existingDetail,
        quantity: existingDetail.quantity + command.payload.quantity,
      });
      return this.saleDetailRepository.update(updatedDetail);
    }

    const saleDetail = new SaleDetail({
      saleId: command.payload.saleId,
      productId: command.payload.productId,
      productName: command.payload.productName,
      productCode: command.payload.productCode,
      quantity: command.payload.quantity,
      unitPrice: command.payload.unitPrice,
    });

    return this.saleDetailRepository.create(saleDetail);
  }
}
