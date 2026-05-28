/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject } from '@nestjs/common';
import { IEventHandler, EventsHandler } from '@nestjs/cqrs';
import type { IEmailService } from '../../application/ports/IEmailService';
import { EMAIL_SERVICE } from '../../application/ports/email-service.token';
import { InvoiceIssuedEvent } from '../../domain/events/invoice-issued.event';
import type { IPdfService } from '../../application/services/pdf-service.interface';
import { PDF_SERVICE } from '../../application/services/pdf-service.interface';
import { Invoice, InvoiceItem } from '../../domain/entities';

@EventsHandler(InvoiceIssuedEvent)
export class InvoiceEmailListener implements IEventHandler<InvoiceIssuedEvent> {
  constructor(
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
    @Inject(PDF_SERVICE) private readonly pdfService: IPdfService,
  ) {}

  async handle(event: InvoiceIssuedEvent): Promise<void> {
    try {
      const items: InvoiceItem[] = event.items.map((d) => new InvoiceItem({
        id: `item-${d.productId}-${Date.now()}`,
        invoiceId: event.invoiceId,
        productId: d.productId,
        productName: d.productName,
        quantity: d.quantity,
        unitPrice: d.unitPrice,
      }));

      const invoice = new Invoice({
        id: event.invoiceId,
        saleId: event.saleId,
        invoiceNumber: event.invoiceNumber,
        issueDate: event.issueDate,
        customerName: event.customerName,
        customerId: event.customerEmail,
        total: event.total,
      });

      await this.pdfService.generateInvoicePdf(invoice, items);

      const result = await this.emailService.sendInvoice(
        event.customerEmail,
        event.invoiceId,
        {
          invoiceNumber: event.invoiceNumber,
          date: event.issueDate.toLocaleDateString('es-EC'),
          customerName: event.customerName,
          items: items.map((item) => ({
            description: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
          total: event.total,
        },
      );

      if (!result.success) {
        console.error(`[InvoiceEmailListener] Email send failed: ${result.error}`);
      } else {
        console.info(
          `[InvoiceEmailListener] Invoice email sent for sale ${event.saleId}, invoice ${event.invoiceId}`,
        );
      }
    } catch (error) {
      console.error(
        `[InvoiceEmailListener] Failed to send invoice email for sale ${event.saleId}:`,
        error,
      );
    }
  }
}
