import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { RemoveSaleDetailCommand } from './remove-sale-detail.command';
import { RemoveSaleDetailValidator } from './remove-sale-detail.validator';
import { SALE_REPOSITORY, SALE_DETAIL_REPOSITORY } from '../../../../tokens';
import type { ISaleRepository, ISaleDetailRepository } from '../../../../../domain/repositories';
import { SaleStatus } from '../../../../../domain/entities';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';

@CommandHandler(RemoveSaleDetailCommand)
export class RemoveSaleDetailHandler implements ICommandHandler<RemoveSaleDetailCommand> {
  constructor(
    private readonly validator: RemoveSaleDetailValidator,
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
    @Inject(SALE_DETAIL_REPOSITORY) private readonly saleDetailRepository: ISaleDetailRepository,
  ) {}

  async execute(command: RemoveSaleDetailCommand): Promise<void> {
    this.validator.validate(command.saleId, command.saleDetailId);

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