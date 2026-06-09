import { CreateInvoiceCommand } from './create-invoice.command';
import { CreateInvoiceValidator } from './create-invoice.validator';
import type { IInvoiceRepository } from '../../../../../domain/repositories/invoice.repository.interface';
import type { IInvoiceItemRepository } from '../../../../../domain/repositories/invoice-item.repository.interface';
import type { IInvoiceSeriesRepository } from '../../../../../domain/repositories/invoice-series.repository.interface';
import type { ISaleDetailRepository } from '../../../../../domain/repositories/sale-detail.repository.interface';
import type { IProductRepository } from '../../../../../domain/repositories/product.repository.interface';
import type { IStockMovementRepository } from '../../../../../domain/repositories/stock-movement.repository.interface';
import { Invoice, InvoiceItem, InvoiceStatus, StockMovement, StockMovementType } from '../../../../../domain/entities';
import { EntityNotFoundException, InsufficientStockException } from '../../../../../domain/exceptions';
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
  items: InvoiceItem[];
}

export class CreateInvoiceHandler {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly invoiceItemRepository: IInvoiceItemRepository,
    private readonly invoiceSeriesRepository: IInvoiceSeriesRepository,
    private readonly saleDetailRepository: ISaleDetailRepository,
    private readonly productRepository: IProductRepository,
    private readonly stockMovementRepository: IStockMovementRepository,
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
      // Audit snapshots
      customerNameSnapshot: command.customerName,
      customerCedulaSnapshot: command.customerCedula,
      customerEmailSnapshot: command.customerEmail,
      cashierNameSnapshot: command.cashierName,
      cashierUsernameSnapshot: command.cashierUsername,
      cashierEmployeeIdSnapshot: command.cashierEmployeeId,
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

    // Decrement stock for each sale detail. The original code path
    // (pre-slice 2 of auth-cookie-refresh) never decremented stock on
    // sale confirmation; the `confirm-sale.use-case.ts` had a comment
    // promising "stock and lot consumption happen atomically when the
    // invoice is issued" but the consumption was never implemented
    // in this handler. We fix the gap here: for each sale detail, the
    // product's currentStock is reduced by detail.quantity, and a
    // SALE stock movement is recorded for traceability.
    for (const detail of saleDetails) {
      const product = await this.productRepository.findByIdForUpdate(detail.productId);
      if (!product) {
        throw new EntityNotFoundException(
          'Product',
          `Product ${detail.productId} referenced by sale detail not found while decrementing stock`,
        );
      }

      const previousStock = product.currentStock ?? 0;
      if (previousStock < detail.quantity) {
        throw new InsufficientStockException(
          product.name,
          detail.quantity,
          previousStock,
        );
      }

      await this.productRepository.decrementStock(detail.productId, detail.quantity);

      await this.stockMovementRepository.create(
        new StockMovement({
          productId: detail.productId,
          type: StockMovementType.SALE,
          quantity: detail.quantity,
          previousStock,
          newStock: previousStock - detail.quantity,
          description: `Sale ${command.saleId} invoice ${savedInvoice.invoiceNumber}`,
          referenceType: 'INVOICE',
          referenceId: savedInvoice.id,
        }),
      );
    }

    const subtotal = this.roundCurrency(
      saleDetails.reduce((sum, detail) => sum + (detail.quantity * detail.unitPrice), 0),
    );
    const iva = this.roundCurrency(
      saleDetails.reduce((sum, detail) => sum + detail.taxAmount, 0),
    );
    const total = this.roundCurrency(subtotal + iva);

    return {
      id: savedInvoice.id,
      saleId: savedInvoice.saleId,
      seriesId: savedInvoice.seriesId,
      invoiceNumber: invoiceNumber,
      issueDate: savedInvoice.issueDate,
      status: savedInvoice.status,
      createdAt: savedInvoice.createdAt,
      subtotal,
      iva,
      total,
      items: savedItems,
    };
  }
}
