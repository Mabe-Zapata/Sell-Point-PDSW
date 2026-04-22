import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GenerateInvoicePdfQuery } from './generate-invoice-pdf.query';
import { GenerateInvoicePdfValidator } from './generate-invoice-pdf.validator';
import { InvoiceItemRepository } from '../../../../../infrastructure/repositories/invoice-item.repository';
import { PdfService } from '../../../../../infrastructure/services/pdf.service';

@QueryHandler(GenerateInvoicePdfQuery)
export class GenerateInvoicePdfHandler implements IQueryHandler<GenerateInvoicePdfQuery> {
  constructor(
    private readonly validator: GenerateInvoicePdfValidator,
    private readonly invoiceItemRepository: InvoiceItemRepository,
    private readonly pdfService: PdfService,
  ) {}

  async execute(query: GenerateInvoicePdfQuery): Promise<Buffer> {
    const invoice = await this.validator.validate(query.id);
    const items = await this.invoiceItemRepository.findByInvoiceId(query.id);

    return this.pdfService.generateInvoicePdf(invoice, items);
  }
}
