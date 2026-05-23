import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateSaleDetailQuantityCommand } from './update-sale-detail-quantity.command';
import { UpdateSaleDetailQuantityValidator } from './update-sale-detail-quantity.validator';
import { SALE_REPOSITORY, SALE_DETAIL_REPOSITORY } from '../../../../tokens';
import type { ISaleRepository, ISaleDetailRepository } from '../../../../../domain/repositories';
import { SaleDetail } from '../../../../../domain/entities';

@CommandHandler(UpdateSaleDetailQuantityCommand)
export class UpdateSaleDetailQuantityHandler implements ICommandHandler<UpdateSaleDetailQuantityCommand> {
  constructor(
    private readonly validator: UpdateSaleDetailQuantityValidator,
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
    @Inject(SALE_DETAIL_REPOSITORY) private readonly saleDetailRepository: ISaleDetailRepository,
  ) {}

  async execute(command: UpdateSaleDetailQuantityCommand): Promise<SaleDetail> {
    this.validator.validate(command.saleId, command.payload);

    const sale = await this.saleRepository.findById(command.saleId);
    if (!sale) {
      throw new Error(`Sale with ID '${command.saleId}' not found`);
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