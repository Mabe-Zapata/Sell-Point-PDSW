import { UpdateSaleDetailQuantityCommand } from './update-sale-detail-quantity.command';
import type { ISaleRepository, ISaleDetailRepository } from '../../../../../domain/repositories';
import { SaleDetail, SaleStatus } from '../../../../../domain/entities';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';

export class UpdateSaleDetailQuantityHandler {
  constructor(
    protected readonly saleRepository: ISaleRepository,
    protected readonly saleDetailRepository: ISaleDetailRepository,
  ) {}

  async execute(command: UpdateSaleDetailQuantityCommand): Promise<SaleDetail> {
    const sale = await this.saleRepository.findById(command.saleId);
    if (!sale) {
      throw new Error(`Sale with ID '${command.saleId}' not found`);
    }

    // R25: Sale modification before confirmation only
    if (sale.status !== SaleStatus.DRAFT) {
      throw new BusinessRuleException('Sale cannot be modified after confirmation');
    }

    const saleDetail = await this.saleDetailRepository.findById(command.payload.saleDetailId);
    if (!saleDetail) {
      throw new Error(`Sale detail with ID '${command.payload.saleDetailId}' not found`);
    }

    const updated = new SaleDetail({
      ...saleDetail,
      quantity: command.payload.quantity,
    });

    return this.saleDetailRepository.update(updated);
  }
}
