import { Inject } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CreateInvoiceCommand } from '../../application/cqrs/invoice/commands/create-invoice/create-invoice.command';
import { SaleConfirmedEvent } from '../../domain/events/sale-confirmed.event';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { INVOICE_REPOSITORY } from '../common/injection-tokens';

@EventsHandler(SaleConfirmedEvent)
export class SaleConfirmedInvoiceListener implements IEventHandler<SaleConfirmedEvent> {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject(INVOICE_REPOSITORY) private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async handle(event: SaleConfirmedEvent): Promise<void> {
    try {
      if (event.invoiceId) {
        return;
      }

      if (!event.branchId) {
        return;
      }

      const existingInvoice = await this.invoiceRepository.findBySaleId(event.saleId);
      if (existingInvoice) {
        return;
      }

      await this.commandBus.execute(
        new CreateInvoiceCommand(
          event.saleId,
          event.branchId,
          event.customerEmail,
          event.customerName,
        ),
      );
    } catch (error) {
      console.error(
        `[SaleConfirmedInvoiceListener] Failed to auto-create invoice for sale ${event.saleId}:`,
        error,
      );
    }
  }
}
