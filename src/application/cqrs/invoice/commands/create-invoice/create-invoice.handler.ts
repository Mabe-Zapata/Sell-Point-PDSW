import { CreateInvoiceCommand } from './create-invoice.command';
import { CreateInvoiceValidator } from './create-invoice.validator';
import type { IInvoiceRepository } from '../../../../../domain/repositories/invoice.repository.interface';
import type { IInvoiceItemRepository } from '../../../../../domain/repositories/invoice-item.repository.interface';
import type { IInvoiceSeriesRepository } from '../../../../../domain/repositories/invoice-series.repository.interface';
import type { ISaleDetailRepository } from '../../../../../domain/repositories/sale-detail.repository.interface';
import { Invoice, InvoiceItem, InvoiceStatus } from '../../../../../domain/entities';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { DuplicateInvoiceForSaleException } from '../../../../../domain/exceptions';
import { randomUUID } from 'crypto';

export interface CreateInvoiceResult {
  id: string;
  saleId: string;
  seriesId: string;
  invoiceNumber: string;
  issueDate: Date;
  status: string;
  createdAt: Date;
  subtotal: number;
  iva: number;
  total: number;
  profitTotal: number;
  items: InvoiceItem[];
}

export class CreateInvoiceHandler {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly invoiceItemRepository: IInvoiceItemRepository,
    private readonly invoiceSeriesRepository: IInvoiceSeriesRepository,
    private readonly saleDetailRepository: ISaleDetailRepository,
  ) {}

  private roundCurrency(value: number): number {
    return Number(value.toFixed(2));
  }

  private isDuplicateSaleInvoiceError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const dbError = error as Error & { code?: string; message: string };
    return (
      dbError.code === '23505'
      || dbError.message.includes('ORA-00001')
    ) && (
      dbError.message.includes('UQ_INVOICES_SALE_ID')
      || dbError.message.includes('SAL_ID')
    );
  }

  async execute(command: CreateInvoiceCommand): Promise<CreateInvoiceResult> {
    CreateInvoiceValidator.validate(command);

    // Prevent duplicate invoice for the same sale
    const existing = await this.invoiceRepository.findBySaleId(command.saleId);
    if (existing) {
      throw new DuplicateInvoiceForSaleException(command.saleId);
    }

    const saleDetails = await this.saleDetailRepository.findBySaleId(command.saleId);
    if (saleDetails.length === 0) {
      throw new EntityNotFoundException('SaleDetail', `No sale details found for sale ${command.saleId}`);
    }

    // Find active invoice series for the branch
    const invoiceSeries = await this.invoiceSeriesRepository.findActiveByBranchId(command.branchId);
    if (!invoiceSeries) {
      throw new EntityNotFoundException(
        'InvoiceSeries',
        `No active invoice series found for branch ${command.branchId}`,
      );
    }

    // Generate sequential invoice number
    const nextSequence = await this.invoiceSeriesRepository.incrementSequence(invoiceSeries.id);
    const paddedSeq = String(nextSequence).padStart(9, '0');
    const invoiceNumber = `${invoiceSeries.establishmentCode}-${invoiceSeries.emissionPointCode}-${paddedSeq}`;

    // Build invoice domain entity
    const invoiceId = randomUUID();
    const invoice = new Invoice({
      id: invoiceId,
      saleId: command.saleId,
      seriesId: invoiceSeries.id,
      invoiceNumber,
      issueDate: new Date(),
      status: InvoiceStatus.ISSUED,
      establishmentCode: invoiceSeries.establishmentCode,
      emissionPointCode: invoiceSeries.emissionPointCode,
    });

    // Persist invoice
    let savedInvoice: Invoice;
    try {
      savedInvoice = await this.invoiceRepository.create(invoice);
    } catch (error) {
      if (this.isDuplicateSaleInvoiceError(error)) {
        throw new DuplicateInvoiceForSaleException(command.saleId);
      }

      throw error;
    }

    // Persist items
    const items = saleDetails.map(
      (detail) =>
        new InvoiceItem({
          invoiceId: savedInvoice.id,
          productId: detail.productId,
          productName: detail.productName,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
          taxRateId: detail.taxRateId,
          taxPercentage: detail.taxPercentage,
          taxAmount: detail.taxAmount,
        }),
    );
    const savedItems = await this.invoiceItemRepository.createMany(items);

    const subtotal = this.roundCurrency(
      saleDetails.reduce((sum, detail) => sum + (detail.quantity * detail.unitPrice), 0),
    );
    const iva = this.roundCurrency(
      saleDetails.reduce((sum, detail) => sum + detail.taxAmount, 0),
    );
    const total = this.roundCurrency(subtotal + iva);
    const profitTotal = 0;
    savedInvoice.profitTotal = profitTotal;
    await this.invoiceRepository.update(savedInvoice);

    return {
      id: savedInvoice.id,
      saleId: savedInvoice.saleId,
      seriesId: savedInvoice.seriesId,
      invoiceNumber: savedInvoice.invoiceNumber,
      issueDate: savedInvoice.issueDate,
      status: savedInvoice.status,
      createdAt: savedInvoice.createdAt,
      subtotal,
      iva,
      total,
      profitTotal,
      items: savedItems,
    };
  }
}
