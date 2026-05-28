import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { QuickConfirmSaleCommand } from '../../../../../application/cqrs/sale/commands/quick-confirm-sale/quick-confirm-sale.command';
import { QuickConfirmSaleUseCase } from '../../../../../application/use-cases/sale/quick-confirm-sale.use-case';
import { TypeOrmUnitOfWork } from '../../../../persistence/typeorm/unit-of-work/typeorm-unit-of-work';
import { TAX_RATE_REPOSITORY } from '../../../../common/injection-tokens';
import { USER_REPOSITORY } from '../../../../common/injection-tokens';
import { INVOICE_SERIES_REPOSITORY } from '../../../../common/injection-tokens';
import { UNIT_OF_WORK } from '../../../../common/injection-tokens';
import { TaxRateRepository } from '../../../../repositories/tax-rate.repository';
import { UserRepository } from '../../../../repositories/user.repository';
import { InvoiceSeriesRepository } from '../../../../repositories/invoice-series.repository';

@CommandHandler(QuickConfirmSaleCommand)
export class QuickConfirmSaleHandler implements ICommandHandler<QuickConfirmSaleCommand> {
  private readonly useCase: QuickConfirmSaleUseCase;

  constructor(
    @Inject(UNIT_OF_WORK) uow: TypeOrmUnitOfWork,
    @Inject(TAX_RATE_REPOSITORY) taxRateRepo: TaxRateRepository,
    @Inject(USER_REPOSITORY) userRepo: UserRepository,
    @Inject(INVOICE_SERIES_REPOSITORY) invoiceSeriesRepo: InvoiceSeriesRepository,
  ) {
    this.useCase = new QuickConfirmSaleUseCase(uow, taxRateRepo, userRepo, invoiceSeriesRepo);
  }

  async execute(command: QuickConfirmSaleCommand) {
    return this.useCase.execute(command.payload);
  }
}