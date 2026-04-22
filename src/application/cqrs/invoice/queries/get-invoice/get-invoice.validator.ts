import { Injectable } from '@nestjs/common';
import { InvoiceRepository } from '../../../../../infrastructure/repositories/invoice.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Invoice } from '../../../../../domain/entities/invoice.entity';

@Injectable()
export class GetInvoiceValidator {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async validate(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new EntityNotFoundException('Invoice', id);
    }
    return invoice;
  }
}
