import { CancelInvoiceCommand } from './cancel-invoice.command';
import { CancelInvoiceValidator } from './cancel-invoice.validator';
import type { IInvoiceRepository } from '../../../../../domain/repositories/invoice.repository.interface';
import { Invoice, InvoiceStatus } from '../../../../../domain/entities';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { BusinessRuleException } from '../../../../../domain/exceptions';

export class CancelInvoiceHandler {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
  ) {}

  async execute(command: CancelInvoiceCommand): Promise<void> {
    CancelInvoiceValidator.validate(command);

    const invoice = await this.invoiceRepository.findById(command.invoiceId);
    if (!invoice) {
      throw new EntityNotFoundException('Invoice', command.invoiceId);
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BusinessRuleException('Invoice is already cancelled');
    }

    const updatedInvoice = new Invoice({
      ...invoice,
      status: InvoiceStatus.CANCELLED,
      cancelledAt: new Date(),
    });

    await this.invoiceRepository.update(updatedInvoice);
  }
}
