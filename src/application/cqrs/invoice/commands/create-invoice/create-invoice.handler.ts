import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { CreateInvoiceCommand } from './create-invoice.command';
import { CreateInvoiceValidator } from './create-invoice.validator';
import { InvoiceRepository } from '../../../../../infrastructure/repositories/invoice.repository';
import { InvoiceItemRepository } from '../../../../../infrastructure/repositories/invoice-item.repository';
import { CustomerRepository } from '../../../../../infrastructure/repositories/customer.repository';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';
import { TaxCalculator } from '../../../../../domain/services/tax-calculator.service';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { InsufficientStockException } from '../../../../../domain/exceptions/insufficient-stock.exception';
import { Invoice } from '../../../../../domain/entities/invoice.entity';
import { InvoiceItem } from '../../../../../domain/entities/invoice-item.entity';
import { Product } from '../../../../../domain/entities/product.entity';

@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler implements ICommandHandler<CreateInvoiceCommand> {
  constructor(
    private readonly validator: CreateInvoiceValidator,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly invoiceItemRepository: InvoiceItemRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly productRepository: ProductRepository,
    private readonly taxCalculator: TaxCalculator,
    private readonly dataSource: DataSource,
  ) {}

  async execute(command: CreateInvoiceCommand): Promise<Invoice> {
    const validated = this.validator.validate(command.payload);

    const customer = await this.customerRepository.findById(validated.customerId);
    if (!customer) {
      throw new EntityNotFoundException('Customer', validated.customerId);
    }

    const productMap = new Map<string, Product>();
    for (const item of validated.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new EntityNotFoundException('Product', item.productId);
      }
      if (product.isActive === false) {
        throw new BadRequestException(`Product ${product.name} is not active`);
      }
      if (product.currentStock < item.quantity) {
        throw new InsufficientStockException(
          product.name,
          item.quantity,
          product.currentStock,
        );
      }
      productMap.set(item.productId, product);
    }

    const invoiceDate = new Date();
    const invoiceNumber = await this.generateInvoiceNumber();

    const invoiceItems: InvoiceItem[] = validated.items.map((itemDto) => {
      const product = productMap.get(itemDto.productId)!;
      return new InvoiceItem({
        productId: itemDto.productId,
        quantity: itemDto.quantity,
        unitPrice: product.salePrice,
      });
    });

    const { subtotal, taxAmount, total } =
      this.taxCalculator.calculateAll(invoiceItems);

    const invoice = new Invoice({
      saleId: command.payload.saleId,
      seriesId: command.payload.seriesId,
      invoiceNumber,
      issueDate: invoiceDate,
      status: 'ISSUED',
      subtotal,
      taxAmount,
      total,
    });

    const savedInvoice = await this.invoiceRepository.create(invoice);

    invoiceItems.forEach((item) => {
      item.invoiceId = savedInvoice.id;
    });

    await this.invoiceItemRepository.createMany(invoiceItems);

    for (const itemDto of validated.items) {
      await this.productRepository.decrementStock(
        itemDto.productId,
        itemDto.quantity,
      );
    }

    const completeInvoice = await this.invoiceRepository.findById(
      savedInvoice.id,
    );
    if (!completeInvoice) {
      throw new Error('Failed to retrieve created invoice');
    }

    return completeInvoice;
  }

  private async generateInvoiceNumber(): Promise<string> {
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');

    const total = await this.invoiceRepository.countByInvoiceNumberPrefix(
      `INV-${datePrefix}`
    );

    const sequenceNumber = total + 1;
    const paddedNumber = sequenceNumber.toString().padStart(5, '0');

    return `INV-${datePrefix}-${paddedNumber}`;
  }
}
