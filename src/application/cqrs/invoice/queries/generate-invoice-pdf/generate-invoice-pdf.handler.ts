import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GenerateInvoicePdfQuery } from './generate-invoice-pdf.query';
import { GenerateInvoicePdfValidator } from './generate-invoice-pdf.validator';
import { InvoiceRepository } from '../../../../../infrastructure/repositories/invoice.repository';
import { InvoiceItemRepository } from '../../../../../infrastructure/repositories/invoice-item.repository';
import { PdfService } from '../../../../../infrastructure/services/pdf.service';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';

@QueryHandler(GenerateInvoicePdfQuery)
export class GenerateInvoicePdfHandler implements IQueryHandler<GenerateInvoicePdfQuery> {
  constructor(
    private readonly validator: GenerateInvoicePdfValidator,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly invoiceItemRepository: InvoiceItemRepository,
    private readonly pdfService: PdfService,
  ) {}

  async execute(query: GenerateInvoicePdfQuery): Promise<Buffer> {
    const id = this.validator.validate(query.id);
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new EntityNotFoundException('Invoice', id);
    }
    const items = await this.invoiceItemRepository.findByInvoiceId(id);
    return this.pdfService.generateInvoicePdf(invoice, items);
  }
}
