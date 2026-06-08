 
 
 
import { Inject, Optional } from '@nestjs/common';
import type { IErrorLogRepository } from '../../domain/repositories';
import { ERROR_LOG_REPOSITORY } from '../common/injection-tokens';
import { ErrorLog } from '../../domain/entities';
import { ExceptionType } from '../../domain/entities/enums';
import { IEventHandler, EventsHandler } from '@nestjs/cqrs';
import type { IEmailService } from '../../application/ports/IEmailService';
import { EMAIL_SERVICE } from '../../application/ports/email-service.token';
import { InvoiceIssuedEvent } from '../../domain/events/invoice-issued.event';
import type { IPdfService } from '../../application/services/pdf-service.interface';
import { PDF_SERVICE } from '../../application/services/pdf-service.interface';
import { Invoice, InvoiceStatus } from '../../domain/entities';
import { INVOICE_QUERY_SERVICE } from '../../application/query-tokens';
import type { IInvoiceQueryService } from '../../domain/query-services/invoice.query-service.interface';
import { INVOICE_ITEM_REPOSITORY } from '../common/injection-tokens';
import type { IInvoiceItemRepository } from '../../domain/repositories';

@EventsHandler(InvoiceIssuedEvent)
export class InvoiceEmailListener implements IEventHandler<InvoiceIssuedEvent> {
  constructor(
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
    @Inject(PDF_SERVICE) private readonly pdfService: IPdfService,
    @Inject(INVOICE_QUERY_SERVICE) private readonly invoiceQueryService: IInvoiceQueryService,
    @Inject(INVOICE_ITEM_REPOSITORY) private readonly invoiceItemRepository: IInvoiceItemRepository,
    @Optional()
    @Inject(ERROR_LOG_REPOSITORY)
    private readonly errorLogRepository?: IErrorLogRepository,
  ) {}

  async handle(event: InvoiceIssuedEvent): Promise<void> {
    try {
      const invoiceData = await this.invoiceQueryService.getInvoiceById(event.invoiceId);
      if (!invoiceData) {
        console.error(`[InvoiceEmailListener] Invoice ${event.invoiceId} not found for email`);
        return;
      }

      const items = await this.invoiceItemRepository.findByInvoiceId(event.invoiceId);

      const invoice = new Invoice({
        id: invoiceData.id,
        saleId: invoiceData.saleId,
        seriesId: invoiceData.seriesId,
        invoiceNumber: invoiceData.invoiceNumber,
        authorizationNumber: invoiceData.authorizationNumber ?? undefined,
        issueDate: invoiceData.issueDate,
        status: invoiceData.status as InvoiceStatus,
        cancelledAt: invoiceData.cancelledAt ?? undefined,
        createdAt: invoiceData.createdAt,
        subtotal: invoiceData.subtotal,
        iva: invoiceData.iva,
        total: invoiceData.total,
        saleNumber: invoiceData.saleNumber,
        customerName: invoiceData.customerName || event.customerName,
        customerId: invoiceData.customerCedula,
        customerCedula: invoiceData.customerCedula,
        establishmentCode: invoiceData.establishmentCode,
        emissionPointCode: invoiceData.emissionPointCode,
        invoiceDate: invoiceData.issueDate,
      });

      const pdfBuffer = await this.pdfService.generateInvoicePdf(invoice, items);

      const result = await this.emailService.sendInvoice(
        event.customerEmail,
        event.invoiceId,
        {
          invoiceNumber: invoiceData.invoiceNumber,
          date: invoiceData.issueDate.toLocaleDateString('es-EC'),
          customerName: invoiceData.customerName || event.customerName,
          customerCedula: invoiceData.customerCedula || undefined,
          subtotal: invoiceData.subtotal,
          iva: invoiceData.iva,
          items: items.map((item) => ({
            description: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            taxPercentage: item.taxPercentage,
            taxAmount: item.taxAmount,
            total: item.total,
          })),
          total: invoiceData.total,
          includeTaxBreakdown: true,
          attachments: [
            {
              filename: `factura-${invoiceData.invoiceNumber}.pdf`,
              content: pdfBuffer,
              mimetype: 'application/pdf',
            },
          ],
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
      const message = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : undefined;
      console.error(
        `[InvoiceEmailListener] Failed to send invoice email for sale ${event.saleId}:`,
        error,
      );
      if (this.errorLogRepository) {
        const errorLog = new ErrorLog({
          exceptionType: ExceptionType.EXTERNAL_SERVICE_ERROR,
          message,
          stackTrace,
          source: 'InvoiceEmailListener',
        });
        this.errorLogRepository.create(errorLog).catch(() => undefined);
      }
    }
  }
}
