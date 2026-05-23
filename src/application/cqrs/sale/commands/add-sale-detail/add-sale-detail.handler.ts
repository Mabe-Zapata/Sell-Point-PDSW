import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { AddSaleDetailCommand } from './add-sale-detail.command';
import { AddSaleDetailValidator } from './add-sale-detail.validator';
import { SALE_REPOSITORY, SALE_DETAIL_REPOSITORY } from '../../../../tokens';
import type { ISaleRepository, ISaleDetailRepository } from '../../../../../domain/repositories';
import { SaleDetail } from '../../../../../domain/entities';

@CommandHandler(AddSaleDetailCommand)
export class AddSaleDetailHandler implements ICommandHandler<AddSaleDetailCommand> {
  constructor(
    private readonly validator: AddSaleDetailValidator,
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
    @Inject(SALE_DETAIL_REPOSITORY) private readonly saleDetailRepository: ISaleDetailRepository,
  ) {}

  async execute(command: AddSaleDetailCommand): Promise<SaleDetail> {
    this.validator.validate(command.payload);

    const sale = await this.saleRepository.findById(command.payload.saleId);
    if (!sale) {
      throw new Error(`Sale with ID '${command.payload.saleId}' not found`);
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