import { Inject } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CancelInvoiceCommand } from '../../application/cqrs/invoice/commands/cancel-invoice/cancel-invoice.command';
import { InvoiceStatus } from '../../domain/entities';
import { SaleCancelledEvent } from '../../domain/events/sale-cancelled.event';
import { INVOICE_REPOSITORY } from '../common/injection-tokens';
import { InvoiceRepository } from '../repositories/invoice.repository';

@EventsHandler(SaleCancelledEvent)
export class SaleCancelledInvoiceListener implements IEventHandler<SaleCancelledEvent> {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject(INVOICE_REPOSITORY) private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async handle(event: SaleCancelledEvent): Promise<void> {
    try {
      const invoice = await this.invoiceRepository.findBySaleId(event.saleId);
      if (!invoice || invoice.status === InvoiceStatus.CANCELLED) {
        return;
      }

      await this.commandBus.execute(new CancelInvoiceCommand(invoice.id));
    } catch (error) {
      console.error(
        `[SaleCancelledInvoiceListener] Failed to cancel invoice for sale ${event.saleId}:`,
        error,
      );
    }
  }
}
