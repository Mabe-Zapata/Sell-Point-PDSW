import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateSaleDetailQuantityCommand } from '../../../../../application/cqrs/sale/commands/update-sale-detail-quantity/update-sale-detail-quantity.command';
import { UpdateSaleDetailQuantityHandler as ApplicationUpdateSaleDetailQuantityHandler } from '../../../../../application/cqrs/sale/commands/update-sale-detail-quantity/update-sale-detail-quantity.handler';
import { SaleDetailRepository } from '../../../../repositories/sale-detail.repository';
import type { ISaleDetailRepository } from '../../../../../domain/repositories/sale-detail.repository.interface';
import { SALE_DETAIL_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(UpdateSaleDetailQuantityCommand)
export class UpdateSaleDetailQuantityHandler implements ICommandHandler<UpdateSaleDetailQuantityCommand> {
  private readonly appHandler: ApplicationUpdateSaleDetailQuantityHandler;

  constructor(
    @Inject(SALE_DETAIL_REPOSITORY) saleDetailRepository: SaleDetailRepository,
  ) {
    this.appHandler = new ApplicationUpdateSaleDetailQuantityHandler(saleDetailRepository as unknown as ISaleDetailRepository);
  }

  async execute(command: UpdateSaleDetailQuantityCommand) {
    return this.appHandler.execute(command);
  }
}
