/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject } from '@nestjs/common';
import { IEventHandler, EventsHandler } from '@nestjs/cqrs';
import type { IEmailService } from '../ports/IEmailService';
import { EMAIL_SERVICE } from '../ports/email-service.token';
import { SaleConfirmedEvent } from '../../domain/events/sale-confirmed.event';
import type { IPdfService } from '../services/pdf-service.interface';
import { PDF_SERVICE } from '../services/pdf-service.interface';
import { Invoice, InvoiceItem } from '../../domain/entities';

@EventsHandler(SaleConfirmedEvent)
export class InvoiceEmailListener implements IEventHandler<SaleConfirmedEvent> {
  constructor(
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
    @Inject(PDF_SERVICE) private readonly pdfService: IPdfService,
  ) {}

  async handle(event: SaleConfirmedEvent): Promise<void> {
    // Only trigger when sale resulted in an invoice
    if (!event.invoiceId) {
      return;
    }

    try {
      // Build domain entities for PDF generation
      const invoice = new Invoice({
        id: event.invoiceId,
        saleId: event.saleId,
        seriesNumber: event.invoiceId,
        issueDate: event.confirmedAt,
        customerEmail: event.customerEmail,
        customerName: event.customerName,
        subtotal: event.total,
        tax: 0,
        total: event.total,
      });

      const items: InvoiceItem[] = (event.details ?? []).map((d) => new InvoiceItem({
        id: `item-${d.productId}-${Date.now()}`,
        invoiceId: event.invoiceId!,
        productId: d.productId,
        productName: d.productName,
        quantity: d.quantity,
        unitPrice: d.unitPrice,
      }));

      const pdfBuffer = await this.pdfService.generateInvoicePdf(invoice, items);

      const result = await this.emailService.sendInvoice(
        event.customerEmail,
        event.invoiceId,
        {
          invoiceNumber: event.invoiceId,
          date: event.confirmedAt.toLocaleDateString('es-EC'),
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
