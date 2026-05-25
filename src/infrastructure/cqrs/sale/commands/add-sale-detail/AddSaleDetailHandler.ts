import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { AddSaleDetailCommand } from '../../../../../application/cqrs/sale/commands/add-sale-detail/add-sale-detail.command';
import { AddSaleDetailHandler as ApplicationAddSaleDetailHandler } from '../../../../../application/cqrs/sale/commands/add-sale-detail/add-sale-detail.handler';
import { SaleRepository } from '../../../../repositories/sale.repository';
import { SaleDetailRepository } from '../../../../repositories/sale-detail.repository';
import type { ISaleDetailRepository } from '../../../../../domain/repositories/sale-detail.repository.interface';
import { SALE_REPOSITORY, SALE_DETAIL_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(AddSaleDetailCommand)
export class AddSaleDetailHandler implements ICommandHandler<AddSaleDetailCommand> {
  private readonly appHandler: ApplicationAddSaleDetailHandler;

  constructor(
    @Inject(SALE_REPOSITORY) saleRepository: SaleRepository,
    @Inject(SALE_DETAIL_REPOSITORY) saleDetailRepository: SaleDetailRepository,
  ) {
    this.appHandler = new ApplicationAddSaleDetailHandler(saleRepository, saleDetailRepository as unknown as ISaleDetailRepository);
  }

  async execute(command: AddSaleDetailCommand) {
    return this.appHandler.execute(command);
  }
}
