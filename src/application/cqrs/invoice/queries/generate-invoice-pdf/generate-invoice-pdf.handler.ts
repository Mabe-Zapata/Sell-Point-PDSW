import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GenerateInvoicePdfQuery } from './generate-invoice-pdf.query';
import { GenerateInvoicePdfValidator } from './generate-invoice-pdf.validator';
import { INVOICE_REPOSITORY, INVOICE_ITEM_REPOSITORY } from '../../../../tokens';
import type { IInvoiceRepository, IInvoiceItemRepository } from '../../../../../domain/repositories';
import { PDF_SERVICE } from '../../../../services/pdf-service.interface';
import { PdfService } from '../../../../../infrastructure/services/pdf.service';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';

@QueryHandler(GenerateInvoicePdfQuery)
export class GenerateInvoicePdfHandler implements IQueryHandler<GenerateInvoicePdfQuery> {
  constructor(
    private readonly validator: GenerateInvoicePdfValidator,
    @Inject(INVOICE_REPOSITORY) private readonly invoiceRepository: IInvoiceRepository,
    @Inject(INVOICE_ITEM_REPOSITORY) private readonly invoiceItemRepository: IInvoiceItemRepository,
    @Inject(PDF_SERVICE) private readonly pdfService: PdfService,
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
