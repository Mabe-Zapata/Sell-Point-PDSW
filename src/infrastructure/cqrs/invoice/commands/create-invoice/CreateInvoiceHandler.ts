import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateInvoiceCommand } from '../../../../../application/cqrs/invoice/commands/create-invoice/create-invoice.command';
import { CreateInvoiceHandler as ApplicationCreateInvoiceHandler } from '../../../../../application/cqrs/invoice/commands/create-invoice/create-invoice.handler';
import { InvoiceRepository } from '../../../../repositories/invoice.repository';
import { InvoiceItemRepository } from '../../../../repositories/invoice-item.repository';
import { InvoiceSeriesRepository } from '../../../../repositories/invoice-series.repository';
import { SaleDetailRepository } from '../../../../repositories/sale-detail.repository';
import {
  INVOICE_REPOSITORY,
  INVOICE_ITEM_REPOSITORY,
  INVOICE_SERIES_REPOSITORY,
  SALE_DETAIL_REPOSITORY,
} from '../../../../common/injection-tokens';
import { InvoiceIssuedEvent } from '../../../../../domain/events/invoice-issued.event';
import type { ISaleDetailRepository } from '../../../../../domain/repositories';

@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler implements ICommandHandler<CreateInvoiceCommand> {
  private readonly appHandler: ApplicationCreateInvoiceHandler;

  private shouldPublishIssuedEvent(command: CreateInvoiceCommand): boolean {
    return Boolean(
      command.customerEmail
      && command.customerName
    );
  }

  constructor(
    @Inject(INVOICE_REPOSITORY) invoiceRepository: InvoiceRepository,
    @Inject(INVOICE_ITEM_REPOSITORY) invoiceItemRepository: InvoiceItemRepository,
    @Inject(INVOICE_SERIES_REPOSITORY) invoiceSeriesRepository: InvoiceSeriesRepository,
    @Inject(SALE_DETAIL_REPOSITORY) saleDetailRepository: SaleDetailRepository,
    private readonly eventBus: EventBus,
  ) {
    this.appHandler = new ApplicationCreateInvoiceHandler(
      invoiceRepository,
      invoiceItemRepository,
      invoiceSeriesRepository,
      saleDetailRepository as unknown as ISaleDetailRepository,
    );
  }

  async execute(command: CreateInvoiceCommand) {
    const result = await this.appHandler.execute(command);

    if (this.shouldPublishIssuedEvent(command)) {
      this.eventBus.publish(
        new InvoiceIssuedEvent(
          result.id,
          result.saleId,
          result.invoiceNumber,
          command.customerEmail!,
          command.customerName!,
          result.issueDate,
          result.total,
          result.subtotal,
          result.iva,
          result.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        ),
      );
    }

    return result;
  }
}
