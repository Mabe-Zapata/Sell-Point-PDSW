import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CancelInvoiceCommand } from '../../../../../application/cqrs/invoice/commands/cancel-invoice/cancel-invoice.command';
import { CancelInvoiceHandler as ApplicationCancelInvoiceHandler } from '../../../../../application/cqrs/invoice/commands/cancel-invoice/cancel-invoice.handler';
import { InvoiceRepository } from '../../../../repositories/invoice.repository';
import { INVOICE_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(CancelInvoiceCommand)
export class CancelInvoiceHandler implements ICommandHandler<CancelInvoiceCommand> {
  private readonly appHandler: ApplicationCancelInvoiceHandler;

  constructor(
    @Inject(INVOICE_REPOSITORY) invoiceRepository: InvoiceRepository,
  ) {
    this.appHandler = new ApplicationCancelInvoiceHandler(invoiceRepository);
  }

  async execute(command: CancelInvoiceCommand): Promise<void> {
    return this.appHandler.execute(command);
  }
}
