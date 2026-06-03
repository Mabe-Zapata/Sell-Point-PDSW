import * as crypto from 'crypto';
import type { IUnitOfWork } from '../../unit-of-work/unit-of-work.interface';
import type { ICategoryRepository } from '../../../domain/repositories/category.repository.interface';
import type { ITaxRateRepository } from '../../../domain/repositories/tax-rate.repository.interface';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import type { ICustomerRepository } from '../../../domain/repositories/customer.repository.interface';
import type { QuickConfirmSalePayload } from '../../cqrs/sale/commands/quick-confirm-sale/quick-confirm-sale.command';
import { SaleConfirmedEvent } from '../../../domain/events/sale-confirmed.event';
import { InvoiceIssuedEvent } from '../../../domain/events/invoice-issued.event';
import { BusinessRuleException } from '../../../domain/exceptions';
import { InvoiceItem } from '../../../domain/entities';
import { CreateInvoiceCommand } from '../../cqrs/invoice/commands/create-invoice/create-invoice.command';
import { CreateInvoiceHandler } from '../../cqrs/invoice/commands/create-invoice/create-invoice.handler';

interface SaleDetailData {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxRateId: string;
  taxPercentage: number;
  taxAmount: number;
}

export interface QuickConfirmSaleResult {
  id: string;
  saleNumber: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: string;
  invoice: {
    id: string;
    saleId: string;
    seriesId: string;
    invoiceNumber: string;
    issueDate: Date;
    status: string;
    subtotal: number;
    iva: number;
    total: number;
    pdfUrl: string;
    items: Array<{
      id: string;
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      taxRateId?: string;
      taxPercentage: number;
      taxAmount: number;
      total: number;
    }>;
  };
}

export class QuickConfirmSaleUseCase {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly categoryRepository: ICategoryRepository,
    private readonly taxRateRepository: ITaxRateRepository,
    private readonly userRepository: IUserRepository,
    private readonly customerRepository: ICustomerRepository,
  ) {}

  private mapInvoiceItems(items: InvoiceItem[]): QuickConfirmSaleResult['invoice']['items'] {
    return items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      taxRateId: item.taxRateId,
      taxPercentage: item.taxPercentage ?? 0,
      taxAmount: item.taxAmount ?? 0,
      total: item.total,
    }));
  }

  async execute(payload: QuickConfirmSalePayload): Promise<QuickConfirmSaleResult> {
    // Validate
    if (!payload.details || payload.details.length === 0) {
      throw new Error('At least one detail is required');
    }
    for (const detail of payload.details) {
      if (!detail.productId) {
        throw new Error('Product ID is required for each detail');
      }
      if (detail.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
    }

    await this.uow.start();

    try {
      // Find user (cashier)
      const user = await this.userRepository.findById(payload.cashierUserId);
      if (!user) {
        throw new BusinessRuleException(`User with ID '${payload.cashierUserId}' not found`);
      }
      if (!user.defaultBranchId) {
        throw new BusinessRuleException('User has no default branch assigned');
      }

      const customer = payload.customerId
        ? await this.customerRepository.findById(payload.customerId)
        : null;
      if (payload.customerId && !customer) {
        throw new BusinessRuleException(`Customer with ID '${payload.customerId}' not found`);
      }

      const customerName = customer
        ? [customer.firstName, customer.lastName].filter(Boolean).join(' ')
        : 'Consumidor Final';
      const customerEmail = customer?.email;

      const saleId = crypto.randomUUID();
      const saleNumber = await this.uow.sales.getNextSaleNumber();

      // Process sale details with per-line tax calculation
      let subtotal = 0;
      let totalTaxAmount = 0;
      const saleDetailsData: SaleDetailData[] = [];

      for (const detail of payload.details) {
        const product = await this.uow.products.findByIdForUpdate(detail.productId);

        if (!product) {
          throw new BusinessRuleException(`Product with ID '${detail.productId}' not found`);
        }

        const currentStock = product.currentStock ?? 0;
        if (currentStock < detail.quantity) {
          throw new BusinessRuleException(
            `Insufficient stock for product ${product.name}. Available: ${currentStock}, Requested: ${detail.quantity}`,
          );
        }

        const unitPrice = Number(product.salePrice);

        // Resolve tax rate from product's category
        const category = await this.categoryRepository.findById(product.categoryId);
        if (!category) {
          throw new BusinessRuleException(`Category not found for product '${product.name}'`);
        }
        if (!category.taxRateId) {
          throw new BusinessRuleException(`Category '${category.name}' has no tax rate assigned`);
        }
        const taxRate = await this.taxRateRepository.findById(category.taxRateId);
        if (!taxRate) {
          throw new BusinessRuleException(`Tax rate not found for category '${category.name}'`);
        }

        const lineSubtotal = detail.quantity * unitPrice;
        const lineTaxAmount = Math.round(lineSubtotal * (Number(taxRate.percentage) / 100) * 100) / 100;
        subtotal += lineSubtotal;
        totalTaxAmount += lineTaxAmount;

        saleDetailsData.push({
          productId: detail.productId,
          productName: product.name,
          productCode: product.code,
          quantity: detail.quantity,
          unitPrice,
          subtotal: lineSubtotal,
          taxRateId: taxRate.id,
          taxPercentage: Number(taxRate.percentage),
          taxAmount: lineTaxAmount,
        });
      }

      const total = subtotal + totalTaxAmount;

      // Create sale (no taxRateId at sale level)
      const { Sale, SaleStatus } = await import('../../../domain/entities/index.js');
      const sale = new Sale({
        id: saleId,
        branchId: user.defaultBranchId,
        customerId: payload.customerId || null,
        cashierUserId: payload.cashierUserId,
        saleNumber,
        status: SaleStatus.CONFIRMED,
        subtotal,
        taxAmount: totalTaxAmount,
        discountAmount: 0,
        total,
      });

      await this.uow.sales.create(sale);

      // Create sale details with tax snapshot
      for (const detail of saleDetailsData) {
        const { SaleDetail } = await import('../../../domain/entities/index.js');
        await this.uow.saleDetails.create(new SaleDetail({
          saleId,
          productId: detail.productId,
          productName: detail.productName,
          productCode: detail.productCode,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
          taxRateId: detail.taxRateId,
          taxPercentage: detail.taxPercentage,
          taxAmount: detail.taxAmount,
        }));
      }

      const invoiceHandler = new CreateInvoiceHandler(
        this.uow.invoices,
        this.uow.invoiceItems,
        this.uow.invoiceSeries,
        this.uow.saleDetails,
      );
      const invoice = await invoiceHandler.execute(
        new CreateInvoiceCommand(
          saleId,
          user.defaultBranchId,
          customerEmail,
          customerName,
        ),
      );

      // Commit transaction
      await this.uow.commit();

      // Dispatch event after successful commit
      this.uow.dispatchEvent(
        new SaleConfirmedEvent(
          saleId,
          new Date(),
          total,
          customerEmail,
          customerName,
          saleDetailsData.map((d) => ({
            productId: d.productId,
            productName: d.productName,
            quantity: d.quantity,
            unitPrice: d.unitPrice,
            subtotal: d.subtotal,
          })),
          invoice.id,
          user.defaultBranchId,
        ),
      );

      if (customerEmail) {
        this.uow.dispatchEvent(
          new InvoiceIssuedEvent(
            invoice.id,
            invoice.saleId,
            invoice.invoiceNumber,
            customerEmail,
            customerName,
            invoice.issueDate,
            invoice.total,
            invoice.subtotal,
            invoice.iva,
            invoice.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })),
          ),
        );
      }

      return {
        id: saleId,
        saleNumber,
        subtotal,
        taxAmount: totalTaxAmount,
        total,
        status: 'CONFIRMED',
        invoice: {
          id: invoice.id,
          saleId: invoice.saleId,
          seriesId: invoice.seriesId,
          invoiceNumber: invoice.invoiceNumber,
          issueDate: invoice.issueDate,
          status: invoice.status,
          subtotal: invoice.subtotal,
          iva: invoice.iva,
          total: invoice.total,
          pdfUrl: `/invoices/${invoice.id}/pdf`,
          items: this.mapInvoiceItems(invoice.items),
        },
      };
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}
