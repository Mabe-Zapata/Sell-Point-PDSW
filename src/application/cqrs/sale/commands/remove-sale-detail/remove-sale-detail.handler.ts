import { RemoveSaleDetailCommand } from './remove-sale-detail.command';
import type { ISaleRepository, ISaleDetailRepository } from '../../../../../domain/repositories';
import { SaleStatus } from '../../../../../domain/entities';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';

export class RemoveSaleDetailHandler {
  constructor(
    protected readonly saleRepository: ISaleRepository,
    protected readonly saleDetailRepository: ISaleDetailRepository,
  ) {}

  async execute(command: RemoveSaleDetailCommand): Promise<void> {
    const sale = await this.saleRepository.findById(command.saleId);
    if (!sale) {
      throw new Error(`Sale with ID '${command.saleId}' not found`);
    }

    // R25: Sale modification before confirmation only
    if (sale.status !== SaleStatus.DRAFT) {
      throw new BusinessRuleException('Sale cannot be modified after confirmation');
    }

    const saleDetail = await this.saleDetailRepository.findById(command.saleDetailId);
    if (!saleDetail) {
      throw new Error(`Sale detail with ID '${command.saleDetailId}' not found`);
    }

    await this.saleDetailRepository.deleteBySaleId(command.saleDetailId);
  }
}
