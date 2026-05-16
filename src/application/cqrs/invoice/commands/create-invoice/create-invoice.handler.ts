import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { CreateInvoiceCommand } from './create-invoice.command';
import { CreateInvoiceValidator } from './create-invoice.validator';
import { InvoiceRepository } from '../../../../../infrastructure/repositories/invoice.repository';
import { InvoiceItemRepository } from '../../../../../infrastructure/repositories/invoice-item.repository';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';
import { TaxCalculator } from '../../../../../domain/services/tax-calculator.service';
import { Invoice } from '../../../../../domain/entities/invoice.entity';
import { InvoiceItem } from '../../../../../domain/entities/invoice-item.entity';

@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler implements ICommandHandler<CreateInvoiceCommand> {
  constructor(
    private readonly validator: CreateInvoiceValidator,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly invoiceItemRepository: InvoiceItemRepository,
    private readonly productRepository: ProductRepository,
    private readonly taxCalculator: TaxCalculator,
    private readonly dataSource: DataSource,
  ) {}

  async execute(command: CreateInvoiceCommand): Promise<Invoice> {
    // Validamos cliente y productos (existencia y stock) antes de iniciar la transacción central
    const { customer, productMap } = await this.validator.validate(
      command.payload,
    );

    // Server-generated invoice date
    const invoiceDate = new Date();
    const invoiceNumber = await this.generateInvoiceNumber();

    const invoiceItems: InvoiceItem[] = command.payload.items.map((itemDto) => {
      const product = productMap.get(itemDto.productId)!;
      return new InvoiceItem({
        productId: itemDto.productId,
        quantity: itemDto.quantity,
        unitPrice: product.unitPrice,
      });
    });

    const { subtotal, iva, total } =
      this.taxCalculator.calculateAll(invoiceItems);

    const invoice = new Invoice({
      invoiceNumber,
      invoiceDate,
      customerId: customer.id,
      subtotal,
      iva,
      total,
    });

    // Save invoice first to get the ID
    const savedInvoice = await this.invoiceRepository.create(invoice);

    // Update invoice items with the invoice ID
    invoiceItems.forEach((item) => {
      item.invoiceId = savedInvoice.id;
    });

    // Save invoice items
    await this.invoiceItemRepository.createMany(invoiceItems);

    // Decrement stock for each product
    for (const itemDto of command.payload.items) {
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
