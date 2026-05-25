import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { RemoveSaleDetailCommand } from '../../../../../application/cqrs/sale/commands/remove-sale-detail/remove-sale-detail.command';
import { RemoveSaleDetailHandler as ApplicationRemoveSaleDetailHandler } from '../../../../../application/cqrs/sale/commands/remove-sale-detail/remove-sale-detail.handler';
import { SaleRepository } from '../../../../repositories/sale.repository';
import { SaleDetailRepository } from '../../../../repositories/sale-detail.repository';
import type { ISaleDetailRepository } from '../../../../../domain/repositories/sale-detail.repository.interface';
import { SALE_REPOSITORY, SALE_DETAIL_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(RemoveSaleDetailCommand)
export class RemoveSaleDetailHandler implements ICommandHandler<RemoveSaleDetailCommand> {
  private readonly appHandler: ApplicationRemoveSaleDetailHandler;

  constructor(
    @Inject(SALE_REPOSITORY) saleRepository: SaleRepository,
    @Inject(SALE_DETAIL_REPOSITORY) saleDetailRepository: SaleDetailRepository,
  ) {
    this.appHandler = new ApplicationRemoveSaleDetailHandler(saleRepository, saleDetailRepository as unknown as ISaleDetailRepository);
  }

  async execute(command: RemoveSaleDetailCommand) {
    return this.appHandler.execute(command);
  }
}
